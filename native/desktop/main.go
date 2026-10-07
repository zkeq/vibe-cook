package main

import (
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/egoist/mygo"
	"github.com/egoist/mygo/plugins/fetch"
)

func main() {
	mygo.Use(fetch.New(fetch.Options{
		Client: &http.Client{Timeout: 5 * time.Minute},
		Allow: func(r *http.Request) bool {
			return r.URL.Scheme == "https" && (r.URL.Hostname() == "cook.corerevive.cn" || r.URL.Hostname() == "cook-api.corerevive.cn")
		},
	}))
	mygo.App.WhenReady(func() {
		win := mygo.NewWindow(mygo.WindowOptions{
			Title: "灵感厨房", URL: "/", Width: 1280, Height: 860,
			MinWidth: 380, MinHeight: 600, StateKey: "main", BackgroundColor: "#ffffff",
			TitleBarStyle: mygo.TitleBarHiddenInset,
		})
		win.Page().OnWillNavigate(func(e *mygo.NavigateEvent) {
			u, err := url.Parse(e.URL)
			if err == nil && e.UserInitiated && (u.Scheme == "https" || u.Scheme == "http") && u.Hostname() != "mygo.localhost" && u.Hostname() != "127.0.0.1" {
				e.PreventDefault()
				go mygo.Shell.OpenExternal(e.URL)
			}
		})
	})
	if err := mygo.App.Run(); err != nil {
		log.Fatal(err)
	}
}
