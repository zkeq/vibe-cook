package main

import (
	"context"
	"errors"
	"sync"

	"github.com/egoist/mygo"
)

// Updates checks for a newer version of the app and installs it in place.
type Updates struct {
	mu      sync.Mutex
	pending *mygo.Update
}

// UpdateProgress is how many bytes of the update were downloaded.
type UpdateProgress struct {
	Downloaded int64 `json:"downloaded"`
	Total      int64 `json:"total"`
}

// Check returns the newer version, or "" when the app is up to date or cannot update itself.
func (u *Updates) Check(ctx context.Context) (string, error) {
	if !mygo.Updater.Enabled() {
		return "", nil
	}
	up, err := mygo.Updater.Check(ctx)
	if err != nil || up == nil {
		return "", err
	}
	u.mu.Lock()
	u.pending = up
	u.mu.Unlock()
	return up.Version, nil
}

// Install downloads the version Check found, verifies its signature and replaces the app,
// sending the download progress. The new version runs after Relaunch or at the next launch.
func (u *Updates) Install(ctx context.Context, progress *mygo.Channel[UpdateProgress]) error {
	u.mu.Lock()
	up := u.pending
	u.mu.Unlock()
	if up == nil {
		return errors.New("没有可安装的更新")
	}
	var lastPercent int64 = -1
	return up.Install(ctx, func(downloaded, total int64) {
		// 每 1% 发一次，避免频繁跨进程通信
		if total > 0 {
			percent := downloaded * 100 / total
			if percent == lastPercent {
				return
			}
			lastPercent = percent
		}
		_ = progress.Send(UpdateProgress{Downloaded: downloaded, Total: total})
	})
}

// Relaunch restarts the app into the installed version.
func (u *Updates) Relaunch() {
	mygo.App.Relaunch()
}
