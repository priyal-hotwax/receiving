import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ReceiveHistoryModalPageRoutingModule } from './receive-history-modal-routing.module';
import { ReceiveHistoryModalPage } from './receive-history-modal.page';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    ComponentsModule,
    FormsModule,
    IonicModule,
    ReceiveHistoryModalPageRoutingModule,
    TranslateModule
  ],
  declarations: [ReceiveHistoryModalPage]
})
export class ReceiveHistoryModalPageModule {}
