import { Component, OnInit, ViewChild } from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import {
  AlertController,
  IonModal,
  ModalController,
  ToastController,
} from "@ionic/angular";
import { Storage } from "@ionic/storage-angular";
import { Observable, Subject } from "rxjs";
import { SurahService } from "src/app/services/surah.service";

@Component({
  selector: "app-memorize",
  templateUrl: "./memorize.page.html",
  styleUrls: ["./memorize.page.scss"],
})
export class MemorizePage implements OnInit {
  @ViewChild(IonModal) modal: IonModal;
  items: Array<Object> = [];
  recommendedChapters = ["الفاتحہ", "یس", "رحمن", "واقعہ", "ملک", "کہف "];
  isOpen: boolean = true;
  memorizeEntryForm: FormGroup;
  surahInfo = [];

  constructor(
    private storage: Storage,
    private alertController: AlertController,
    private toastController: ToastController,
    private modalController: ModalController,
    public formBuilder: FormBuilder,
    private surahService: SurahService
  ) {}

  ngOnInit() {
    this.setupStorage();
    this.storage.get("memorize").then((items) => {
      if (items) this.items = items.sort((a: any, b: any) => a.juz - b.juz);
    });
    // this.surahService
    //   .getSurahInfo()
    //   .subscribe((res: any) => (this.surahInfo = res));
    // this.memorizeEntryForm = this.formBuilder.group({
    //   date: new FormControl(new Date().toISOString()),
    //   number: new FormControl(""),
    //   surah: new FormControl("", Validators.required),
    //   from: new FormControl("", Validators.required),
    //   to: new FormControl("", Validators.required),
    //   finished: new FormControl(false),
    // });
  }
  async setupStorage() {
    await this.storage.create();
  }

  async add(item?) {
    const alert = await this.alertController.create({
      subHeader: item ? "Update" : "Add",
      cssClass: "custom-alert",
      inputs: [
        {
          name: "juz",
          id: "juz",
          type: "number",
          placeholder: "Juz number...",
          value: item ? item.juz : null,
          handler: (input) => {
            console.log("Inside handler:", input);
          },
        },
        {
          name: "completed",
          id: "completed",
          type: "number",
          placeholder: "Pages memorized...",
          value: item ? item.completed : null,
        },
      ],
      buttons: [
        {
          text: "Cancel",
          role: "cancel",
        },
        {
          ...(item
            ? {
                text: "Delete",
                handler: (data) => {
                  console.log("deleting ", data.juz);
                  this.items.splice(
                    this.items.findIndex((i: any) => i.juz === item.juz),
                    1
                  );
                  this.saveItems();
                },
                cssClass: "delete-btn",
              }
            : null),
        },
        {
          text: item ? "Update" : "Add",
          cssClass: "add-btn",
          handler: (data) => {
            if (data.juz < 0 || data.juz > 30) {
              this.toast("Invalid juz number: " + data.juz, "danger");
              return;
            }
            const totalPages = this.getJuzInfo(data.juz, "count");
            console.log(data, totalPages);
            if (parseInt(data.completed) > totalPages) {
              this.toast(
                `Juz ${data.juz} doesn't have that many pages. (${data.completed}) It only has ${totalPages}.`,
                "danger"
              );
              return;
            }
            data.juz = parseInt(data.juz);
            data.completed = parseInt(data.completed);
            data.started = item ? item.started : new Date();
            data.updated = new Date();
            data.total = totalPages;
            item
              ? (this.items[
                  this.items.findIndex((n: any) => n.juz === item.juz)
                ] = data)
              : this.items.push(data);
            console.log(data);
            //Sort
            this.items = this.items.sort((a: any, b: any) => a.juz - b.juz);
            //Save
            this.saveItems();
          },
        },
      ],
    });
    alert.present();
  }
  saveItems() {
    this.storage.set("memorize", this.items);
  }
  getFormattedDate = (date) => new Date(date).toLocaleDateString();
  openModelWithItem(item) {
    this.modal.present().then();
  }
  closeModal() {
    this.isOpen = false;
    this.modalController.dismiss();
  }
  getValueFromModal(e) {
    if (e.detail.data) {
      console.log(e);
      this.storage.set(e.detail.data.number, e.detail.data);
      this.items.push(e.detail.data);
    }
  }
  toggle(e) {
    // console.log(e.detail.checked);
  }
  onSubmit() {
    this.modalController.dismiss(this.memorizeEntryForm.value);
  }
  dateChanged(ev) {
    console.log(ev.detail.value);
  }
  async toast(msg, clr = "primary") {
    const t = await this.toastController.create({
      message: msg,
      color: clr,
      duration: 3000,
    });
    t.present();
  }
  getJuzInfo(num, method) {
    if (typeof num !== "number") num = parseInt(num);
    switch (method) {
      case "name":
        return this.surahService.juzNames[num - 1];
        break;
      case "count":
        return num === this.surahService.juzPageNumbers.length
          ? 611 - this.surahService.juzPageNumbers[num - 1] + 1
          : this.surahService.juzPageNumbers[num] -
              this.surahService.juzPageNumbers[num - 1];
        break;

      default:
        return this.surahService.juzNames[num - 1];
        break;
    }
  }
}
