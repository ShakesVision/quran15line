import { HttpClient } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Storage } from "@ionic/storage-angular";
import { SurahService } from "src/app/services/surah.service";

@Component({
  selector: "app-juz",
  templateUrl: "./juz.page.html",
  styleUrls: ["./juz.page.scss"],
})
export class JuzPage implements OnInit {
  pages = [];
  juzPages = [];
  surahPages = [];
  rukuArray = [];
  constructor(
    private router: Router,
    private storage: Storage,
    private httpClient: HttpClient,
    private surahService: SurahService
  ) {}

  ngOnInit() {
    this.storage.create().then((_) => console.log("storage created"));
    this.gotoReadJuz("Quran", true);
  }

  gotoReadJuz(juz, stopNav = false) {
    if (typeof juz === "number") juz = "Juz" + juz;
    this.storage
      .get(juz)
      .then((res) => {
        if (res) {
          console.log("found in device storage", res);
          if (stopNav) this.calculateJuzData(res.data);
          if (!stopNav) this.navigate(res);
        } else {
          console.log("NOT found in local storage, fetching from server...");
          this.fetchAndSaveInDeviceStorage(juz, true);
        }
      })
      .catch((err) => {
        console.log("error reading the database.");
      });
  }
  fetchAndSaveInDeviceStorage(juz, stopNav = false) {
    this.httpClient
      .get(
        `https://raw.githubusercontent.com/ShakesVision/Quran_archive/master/15Lines/${juz}.txt`,
        { responseType: "text" }
      )
      .subscribe(
        (res) => {
          console.log("Fetch successful...");
          if (stopNav) this.calculateJuzData(res);
          // Add extra line (\n) at the end of each file to avoid truncating last line of the file in split
          const juzData = { title: juz, data: res, rukuArray: this.rukuArray };
          this.storage.set(juz, juzData).then((_) => {
            console.log("Have been saved in your device successfully.");
          });
          if (!stopNav) this.navigate(juzData);
        },
        (err) => {
          console.log("fetch failed.");
        }
      );
  }
  navigate(juzData, i = 0) {
    if (i != 0)
      juzData = { title: i, data: juzData, rukuArray: this.rukuArray };
    this.router.navigate(["/read"], { state: { juzData } });
  }
  calculateJuzData(juzData) {
    this.pages = juzData.split("\n\n");
    const juzPageNumbers = this.surahService.juzPageNumbers;
    juzPageNumbers.forEach((pageNumber, juzIndex) => {
      let juzRukuArray = [];
      const singleJuzPages = this.pages.filter((p, i) => {
        const isJuzPage: boolean =
          i >= pageNumber - 1 &&
          (!!juzPageNumbers[juzIndex + 1]
            ? i < juzPageNumbers[juzIndex + 1] - 1
            : i < this.pages.length);
        return isJuzPage;
      });
      this.juzPages.push(singleJuzPages.join("\n\n"));
      singleJuzPages.forEach((page, juzPageIndex) => {
        if (page.includes(this.surahService.diacritics.RUKU_MARK))
          page.split("\n").forEach((line, lineIndex) => {
            if (line.includes(this.surahService.diacritics.RUKU_MARK))
              juzRukuArray.push({ juzPageIndex, lineIndex, line });
          });
      });
      this.rukuArray.push(juzRukuArray);
    });
    console.log(this.juzPages);

    // try for surahs similarly
    /* const surahPageNumbers = this.surahService.surahPageNumbers;
    console.log(surahPageNumbers);
    surahPageNumbers.forEach((pageNumber, surahIndex) => {
      const singleSurahPages = this.pages.filter((p, i) => {
        const isSurahPage: boolean =
          i >= pageNumber - 1 &&
          (!!surahPageNumbers[surahIndex + 1]
            ? i < surahPageNumbers[surahIndex + 1] - 1
            : i < this.pages.length);
        return isSurahPage;
      });
      this.surahPages.push(singleSurahPages.join("\n\n"));
    });
    console.log(this.surahPages); */
  }
}