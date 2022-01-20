import { Component, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { AddProductModalPage } from '../add-product-modal/add-product-modal.page';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { HcProvider } from '../../providers/hc.provider';
import { StorageProvider } from '../../providers/storage.provider';
import { WidgetProvider } from '../../providers/widget.provider';
import { UtilProvider } from '../../providers/util.provider';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { ReceiveHistoryModalPage } from '../receive-history-modal/receive-history-modal.page';

@Component({
  selector: 'app-purchase-orders-details',
  templateUrl: './purchase.orders.details.html',
  styleUrls: ['./purchase.orders.details.scss'],
})
export class PurchaseOrdersDetails implements OnInit {

  public isModalOpen = false;
  public modalKeyListener;
  public shipment:any = {};
  public SKU: any;
  viewSize: number = 10;
  viewIndex: number = 0;
  orderId: string = '';
  field = 'orderId';
  group: boolean = true;
  limit = 10000;
  orderDetails: any;
  constructor(
    public translate: TranslateService,
    private activatedRoute: ActivatedRoute,
    private modalController: ModalController,
    private hcProvider: HcProvider,
    private storageProvider: StorageProvider,
    private widgetProvider: WidgetProvider,
    public utilProvider: UtilProvider,
    private router: Router,
    private alertController: AlertController,
    public platform: Platform
  ) {
    this.modalKeyListener = (ev: any) => {
      if (ev.ctrlKey && ev.key === 'o') {
        ev.preventDefault();
        this.addProduct();
      }
    }
    window.addEventListener('keydown', this.modalKeyListener);
  }

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe(paramMap => {
      if(!paramMap.has('id')) {
        return;
      }
      const orderId = paramMap.get('id');
      this.getPurchaseOrderDetail(orderId, this.viewSize, this.field, this.group, this.limit);
    })
  }

  ionViewDidLeave() {
    window.removeEventListener('keydown', this.modalKeyListener);
  }

  getPurchaseOrderDetail(orderId, viewSize, field, group, limit) {
    this.widgetProvider.presentLoader('');
    this.utilProvider.getPurchaseOrders(viewSize, field, group, limit, orderId).then((data: any) => {
        if (data) {
          this.orderDetails = data[0];
          this.orderDetails.quantityAccepted = 0;
          this.storageProvider.setLocalStorageItem(orderId, JSON.stringify(this.orderDetails));
        }
        this.widgetProvider.dismissLoader();
      },
      (err) => {
        this.widgetProvider.dismissLoader();
        this.widgetProvider.showToast(err);
      }
    )
  }

  receiveAll(item) {
    // Accept the quantity as same as ordered quantity
    // this.shipment.items.filter(ele => {
    //   if(ele.itemSeqId == item.itemSeqId) {
    //     ele.quantityAccepted = ele.quantityOrdered;
    //     // The 'value' properties of progress bar should be between 0 and 1 hence set the value accordingly.
    //     ele.progress = ele.quantityAccepted / ele.quantityOrdered
    //     this.storageProvider.setLocalStorageItem(this.shipment.shipmentId, JSON.stringify(this.shipment))
    //   }
    // })
    item.progress = item.quantity;
  }

  setAcceptedQuantity(item, qty) {
    // WM can accept less or more than ordered quantity
    item.progress = qty / item.quantity;
    item.quantityAccepted = qty;
  }

  async receiveShipmentItems() {
    const alert = await this.alertController.create({
      cssClass: '',
      header: this.translate.instant('Receive Shipment'),
      message: this.translate.instant('ConfirmQuantity'),
      buttons: [
        {
          text: this.translate.instant('Cancel'),
          role: 'cancel', // This handler will be invoked on tapping backdrop
          cssClass: '',
          handler: () => {
          }
        }, {
          text: this.translate.instant('Proceed'),
          handler: () => {
            let shipmentParam = {
              orderId: this.orderDetails.orderId,
              statusId : "PURCH_SHIP_RECEIVED"
            }
            this.widgetProvider.presentLoader('');
              if(this.orderDetails.quantityAccepted > 0) {
                let params = {
                  shipmentId: this.orderDetails.orderId,
                  facilityId: this.orderDetails.facilityId,
                  shipmentItemSeqId: this.orderDetails.orderItemSeqId,
                  productId: this.orderDetails.productId,
                  quantityAccepted: this.orderDetails.quantityAccepted,
                  locationSeqId: this.orderDetails.locationSeqId
                }

                this.hcProvider.callRequest('post', 'receiveShipmentItem', params).subscribe((data: any) => {
                  // if( data.body && (item.quantityAccepted == data.body.quantityAccepted)) {
                    this.hcProvider.callRequest('post', 'updateShipment', shipmentParam).subscribe((data: any) => {
                      if(data.body && data.body._EVENT_MESSAGE_) {
                        this.storageProvider.removeLocalStorageItem(this.shipment.shipmentId);
                        this.widgetProvider.showToast(this.translate.instant('ShipmentReceived') + ' ' + data.body.shipmentId)
                        this.router.navigateByUrl('/home');
                      }
                    })
                    this.widgetProvider.dismissLoader();
                  // } else {
                  // }
                }, (err) => {
                  this.widgetProvider.dismissLoader();
                  this.widgetProvider.showToast(err);
                })
              } else {
                // Further we will remove this toast once the functionality is available to close shipment
                this.widgetProvider.dismissLoader();
                this.widgetProvider.showToast(this.translate.instant('ZeroQuantity'))
              }
            // })
          }
        }
      ]
    });
    await alert.present();
  }

  scanProduct(event, SKU) {
    if (event && event.key === 'Enter') {
      this.widgetProvider.presentLoader('');
      let query = `filters={internalName=${SKU}}`;
      this.utilProvider.findProduct(query).then((data: any) => {
        if(data.length) {
          this.shipment.items.filter((item) => (item.sku == data[0].sku))
            .map(updateItem => {
              if(updateItem) {
                // If entered SKU matched then increased the quantity by 1
                updateItem.quantityAccepted++;
                this.storageProvider.setLocalStorageItem(this.shipment.shipmentId, JSON.stringify(this.shipment))
              } else {
                // Otherwise toast message will be displayed
                this.widgetProvider.showToast(this.translate.instant('ScannedItemNotFound'))
              }
          })
        }
        this.widgetProvider.dismissLoader();
      }).catch((e) => {
        this.widgetProvider.dismissLoader();
      })
    }
  }

  async addProduct() {
    // If the modal is already opened then again the modal should not be open
    if(!this.isModalOpen) {
      const modal = await this.modalController.create({
        component: AddProductModalPage,
        cssClass: '',
        componentProps: {
          'shipment': this.shipment
        }
      });
      // Initially the flag is false hence set it to true after opening the modal
      this.isModalOpen = true
      modal.onDidDismiss().then(() => {
        // After dismissing the modal, set the flag to false so that modal can be open with either click event or CTRL+ command
        this.isModalOpen = false
      });
      return await modal.present();
    }
  }

  async addReceiveHistory() {
    // If the modal is already opened then again the modal should not be open
    if(!this.isModalOpen) {
      const modal = await this.modalController.create({
        component: ReceiveHistoryModalPage,
        cssClass: '',
        componentProps: {
          'shipment': this.shipment
        }
      });
      // Initially the flag is false hence set it to true after opening the modal
      this.isModalOpen = true
      modal.onDidDismiss().then(() => {
        // After dismissing the modal, set the flag to false so that modal can be open with either click event or CTRL+ command
        this.isModalOpen = false
      });
      return await modal.present();
    }
  }

}