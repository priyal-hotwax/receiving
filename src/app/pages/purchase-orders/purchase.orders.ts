import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { StorageProvider } from 'src/app/providers/storage.provider';
import { UtilProvider } from '../../providers/util.provider';
import { WidgetProvider } from './../../providers/widget.provider';

@Component({
  selector: 'app-purchase-orders',
  templateUrl: 'purchase.orders.html',
  styleUrls: ['purchase.orders.scss'],
})
export class PurchaseOrders {

  viewSize: number = 10;
  viewIndex: number = 0;
  orderId: string = '';
  field = 'orderId';
  group: boolean = true;
  limit = 10000;
  orders: any;
  constructor(
    public translate: TranslateService,
    public utilProvider: UtilProvider,
    private widgetProvider: WidgetProvider,
    private router: Router,
    private storageProvider:StorageProvider
  ) {
  }

  ionViewWillEnter() {
    if(!this.orderId) {
      if(!this.widgetProvider.isLoading) this.widgetProvider.presentLoader('')
      this.getPurchaseOrders(this.viewSize,this.field, this.group, this.limit);
    }
  }

  getPurchaseOrders(viewSize, field, group, limit) {
    this.utilProvider.getPurchaseOrders(viewSize, field, group, limit).then((data: any) => {
      if (event) {
        if (data.length) {
          // In case of infinite scrolling, push the data to shared variable
          this.orders = data;
        } else {
          // If we dont get more shipments on next viewIndex then a toast msg will be displayed.
          this.widgetProvider.showToast(this.translate.instant('AllShipmentsLoaded'));
        }
      } else {
        // Otherwise assign the data to shared variable
        this.orders = data;
      }
      this.widgetProvider.dismissLoader();
    }).catch((e) => {
      this.widgetProvider.dismissLoader();
    })
  }

  ngOnInit() {
  }

  loadMoreShipments() {
    this.viewIndex = Math.ceil((this.viewIndex * this.viewSize + 1) / this.viewSize);
    // Display loader while tapping on Load more shipments button
    if(!this.widgetProvider.isLoading) this.widgetProvider.presentLoader('');
    this.getPurchaseOrders(this.viewSize,this.field, this.group, this.limit);
  }

  getPurchaseOrder(event, viewSize, field, group, limit) {
    console.log(event, event.target.value);
    if (event && event.key === 'Enter' && event.target.value.length > 3) {
      this.widgetProvider.presentLoader('');
      this.utilProvider.getPurchaseOrders(this.viewSize,this.field, this.group, this.limit,  event.target.value).then((data: any) => {
        if(data.length) {
          this.orders = data;
        } else {
          this.orderId = '';
          this.widgetProvider.showToast(this.translate.instant('NoResultsFound'));
        }
        this.widgetProvider.dismissLoader();
      }).catch((e) => {
        this.widgetProvider.dismissLoader();
      })
    }
  }

  purchaseOrderDetails(orderId, orderDetails) {
    this.router.navigate(['/purchase-orders', orderId]);
    this.storageProvider.setLocalStorageItem(orderId, JSON.stringify(orderDetails));

  }

  clearShipment() {
    this.widgetProvider.presentLoader('');
    this.getPurchaseOrders(10,'orderId', true, 10 )
  }

}
