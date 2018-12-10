package main

import (
    "fmt"
    "io/ioutil"
    "log"
    "net/http"
    "os"
    "path/filepath"
)

// HTML files cache
var (
    indexHtml string
    notFoundHtml string
)

func readFile(path string) string {
    var a, err = ioutil.ReadFile(path)
    if err != nil {
        log.Fatal(err)
    }

    return string(a)
}

func main() {

    indexHtml = readFile(filepath.Join("dist", "index.html"))
    notFoundHtml = readFile(filepath.Join("static", "404.html"))

    http.HandleFunc("/", indexHandler)

    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
        log.Printf("Defaulting to port %s", port)
    }

    log.Printf("Listening on port %s", port)
    log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", port), nil))
}

func indexHandler(w http.ResponseWriter, r *http.Request) {

    // When path is not a match, output the custom 404 Not Found HTML page
    if r.URL.Path != "/" {
        w.WriteHeader(404)
        fmt.Fprintf(w, notFoundHtml)
        return
    }

    fmt.Fprintf(w, indexHtml)
}
