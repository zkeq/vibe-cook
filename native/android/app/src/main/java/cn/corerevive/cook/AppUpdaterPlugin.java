package cn.corerevive.cook;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** 从 CNB Release 检查新版本，下载 APK 并调起系统安装。 */
@CapacitorPlugin(name = "AppUpdater")
public class AppUpdaterPlugin extends Plugin {
    private static final String RELEASES_URL = "https://cnb.cool/onmicrosoft/vibe-cook/frontend/-/releases?page=1&page_size=20";
    private static final Pattern VERSION = Pattern.compile("^v?(\\d+)\\.(\\d+)\\.(\\d+)$");

    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void check(PluginCall call) {
        executor.execute(() -> {
            try {
                String current = currentVersion();
                JSONArray releases = new JSONArray(readText(RELEASES_URL));
                JSObject result = new JSObject();
                result.put("current", current);
                // 列表按时间倒序，取第一个带 APK 的正式版；kws-* 等非客户端 Release 跳过
                for (int i = 0; i < releases.length(); i++) {
                    JSONObject release = releases.getJSONObject(i);
                    String tag = release.optString("tag_name");
                    if (!VERSION.matcher(tag).matches() || release.optBoolean("draft") || release.optBoolean("prerelease")) continue;
                    JSONObject apk = findApk(release.optJSONArray("assets"));
                    if (apk == null) continue;
                    if (compare(tag, current) > 0) {
                        result.put("version", tag.replaceFirst("^v", ""));
                        result.put("url", apk.getString("browser_download_url"));
                        result.put("size", apk.optLong("size"));
                    }
                    break;
                }
                call.resolve(result);
            } catch (Exception e) {
                call.reject("检查更新失败：" + e.getMessage(), e);
            }
        });
    }

    @PluginMethod
    public void download(PluginCall call) {
        String url = call.getString("url");
        if (url == null) {
            call.reject("缺少下载地址");
            return;
        }
        executor.execute(() -> {
            HttpURLConnection conn = null;
            try {
                conn = open(url);
                long total = conn.getContentLengthLong();
                File file = apkFile();
                long downloaded = 0;
                long lastPercent = -1;
                try (InputStream in = conn.getInputStream(); OutputStream out = new FileOutputStream(file)) {
                    byte[] buffer = new byte[64 * 1024];
                    int n;
                    while ((n = in.read(buffer)) != -1) {
                        out.write(buffer, 0, n);
                        downloaded += n;
                        long percent = total > 0 ? downloaded * 100 / total : -1;
                        // 每 1% 通知一次页面
                        if (percent != lastPercent) {
                            lastPercent = percent;
                            JSObject progress = new JSObject();
                            progress.put("downloaded", downloaded);
                            progress.put("total", total);
                            notifyListeners("downloadProgress", progress);
                        }
                    }
                }
                if (total > 0 && downloaded != total) throw new Exception("下载不完整");
                call.resolve();
            } catch (Exception e) {
                call.reject("下载更新失败：" + e.getMessage(), e);
            } finally {
                if (conn != null) conn.disconnect();
            }
        });
    }

    /** 调起系统安装器；没有「安装未知应用」权限时先打开设置页，返回 needsPermission。 */
    @PluginMethod
    public void install(PluginCall call) {
        JSObject result = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !getContext().getPackageManager().canRequestPackageInstalls()) {
            Intent settings = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getContext().getPackageName()));
            settings.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(settings);
            result.put("needsPermission", true);
            call.resolve(result);
            return;
        }
        File file = apkFile();
        if (!file.exists()) {
            call.reject("安装包不存在，请重新下载");
            return;
        }
        Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", file);
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(uri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        result.put("needsPermission", false);
        call.resolve(result);
    }

    private File apkFile() {
        File dir = new File(getContext().getCacheDir(), "updates");
        //noinspection ResultOfMethodCallIgnored
        dir.mkdirs();
        return new File(dir, "vibe-cook-update.apk");
    }

    private String currentVersion() throws Exception {
        PackageInfo info = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
        return info.versionName;
    }

    private static JSONObject findApk(JSONArray assets) throws Exception {
        if (assets == null) return null;
        for (int i = 0; i < assets.length(); i++) {
            JSONObject asset = assets.getJSONObject(i);
            if (asset.optString("name").endsWith(".apk") && asset.has("browser_download_url")) return asset;
        }
        return null;
    }

    private static int compare(String a, String b) {
        Matcher ma = VERSION.matcher(a);
        Matcher mb = VERSION.matcher(b);
        if (!ma.matches() || !mb.matches()) return 0;
        for (int i = 1; i <= 3; i++) {
            int diff = Integer.compare(Integer.parseInt(ma.group(i)), Integer.parseInt(mb.group(i)));
            if (diff != 0) return diff;
        }
        return 0;
    }

    private static HttpURLConnection open(String url) throws Exception {
        // CNB 下载地址会跳转到对象存储，手动跟随以支持跨域名跳转
        for (int i = 0; i < 5; i++) {
            HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
            conn.setInstanceFollowRedirects(false);
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(30000);
            conn.setRequestProperty("Accept", "application/json, application/octet-stream");
            int status = conn.getResponseCode();
            if (status >= 300 && status < 400) {
                url = new URL(new URL(url), conn.getHeaderField("Location")).toString();
                conn.disconnect();
                continue;
            }
            if (status != 200) throw new Exception("HTTP " + status);
            return conn;
        }
        throw new Exception("跳转次数过多");
    }

    private static String readText(String url) throws Exception {
        HttpURLConnection conn = open(url);
        try (InputStream in = conn.getInputStream()) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buffer = new byte[16 * 1024];
            int n;
            while ((n = in.read(buffer)) != -1) out.write(buffer, 0, n);
            return out.toString("UTF-8");
        } finally {
            conn.disconnect();
        }
    }
}
