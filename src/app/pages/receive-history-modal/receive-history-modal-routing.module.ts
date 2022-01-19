import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReceiveHistoryModalPage } from './receive-history-modal.page';

const routes: Routes = [
  {
    path: '',
    component: ReceiveHistoryModalPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReceiveHistoryModalPageRoutingModule {}
