import { Component, EventEmitter, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { IResponse } from 'src/app/Models/api-response-model';
import {ProductModels} from 'src/app/models/product-models';
import { ProductInputPage } from 'src/app/pages/product-input/product-input.page';
import { HttpProviderService } from 'src/app/Services/http-provider/http-provider.service';

@Component({
  selector: 'app-product-tab',
  templateUrl: './product-tab.page.html',
  styleUrls: ['./product-tab.page.scss'],
})
export class ProductTabPage implements OnInit {

  name = "Product";
  iconAdd = "add"

  // API Response values
  employees: ProductModels.IProduct[] = []
  nextPage?: number = null;
  currentPage?: number = null;
  previousPage?: number = null;

  // Navigation helpers
  loaded: boolean = false;
  error: boolean = false;
  loading: boolean = false;
  addingElement: boolean = false;

  constructor(private http: HttpProviderService, public modalController: ModalController) { }

  ngOnInit() {
    this.getPage(1);
  }

  //////////////////////////////////

  // NOTA: Cambiar los alerts por algún cuadro de diálogo que salga por unos segundos y se vuelva a ocultar
  // pero que el usuario no tenga que quitar manualmente.

  //////////////////////////////////


  // HTTP REQUESTS //

  getPage(page: number) {
    this.loading = true;

    this.http.getRequest<IResponse<ProductModels.IProduct>>(this.name, `pages/${page}`)
      .subscribe(
        (data) => {
          // Load info from the response.
          this.nextPage = data.nextPage;
          this.currentPage = data.currentPage;
          this.previousPage = data.previousPage;
          this.employees = data.responseList;
          
          // Check if the response list is not empty.
          this.loaded = this.employees.length > 0 ? true : false;

          // The API responded succesfully
          this.error = false;
        },
        (error) => {
          // Reset values
          this.nextPage = null;
          this.currentPage = null;
          this.previousPage = null;

          this.error = true;
          this.loaded = false;

          console.log(error);
        }
      )
      .add(() => {
        this.loading = false;
      });
  }


  addElement(employee: ProductModels.IProductPost) {
    this.addingElement = true;

    // Esta información viene de un forms.
    /*
    let employee: EmployeeModels.IEmployeePost = {
      homeAddress: "Una casa",
      name: "Un nombre",
      familyName: "Un apellido"
    }
    */

    this.http.postRequest(this.name, employee)
      .subscribe(
        (data) => {
          alert("Successfully Added!");

          // If we are in the last page, reload to show the "Next Page" button.
          if(!this.nextPage)
            this.reloadCurrentPage();
        },
        (err) => {
          if(err.status == 409)
            alert("One or more fields in the provided information infringe a constraint on the Data Base. Failed to Add.")
          else
            alert("An unexpected error ocurred while adding the record.");
        }
      )
      .add(
        () => {this.addingElement = false;}
      );
  }


  updateElement($event) {
    let employee: ProductModels.IProduct = $event;
    // Esta información vendría del formulario
    /*
    let employee: EmployeeModels.IEmployeePut = {
      homeAddress: "Casita 2",
      name: "Nombre 2",
      familyName: "Apellido 2"
    }
    */
    
    this.http.putRequest(this.name, employee.id.toString(), employee)
      .subscribe(
        (data) => {
          alert("Successfully Modified!");

          // Reload the page to show the changes.
          this.reloadCurrentPage();
        },
        (err) => {
          if(err.status == 409)
            alert("One or more fields in the modified information infringee a constraint on the Data Base.\nFailed to Modify.")
          else
            alert("An unexpected error ocurred while updating the data.");
        }
      );
  }


  deleteElement($event) {
    let id = $event;

    this.http.deleteRequest(this.name, `${id}`)
      .subscribe(
        (data) => {
          // If the deleated employee is the las employee of the page.
          if(this.employees.length == 1) {
            // If there is a previous page, go back.
            if(this.previousPage)
              this.getPreviousPage();
            
            // If there is not a previous page, but there is a next page, go next.
            else if(this.nextPage)
              this.getNextPage();
            
            // Otherwise, there are no more elements to show
            else {
              this.nextPage = null;
              this.currentPage = null;
              this.previousPage = null;

              this.loaded = false;
            }
          }

          // Otherwise, reload the page to show the changes.
          else
            this.reloadCurrentPage();
        },
        (err) => {
          if(err.status == 409)
            alert("Cannot delete this element because it infringes a Constraint.")
          else
            alert("An unexpected error ocurred while deleting the record.");
        }
      );
  }


  // NAVIGATION //
  reloadCurrentPage() {
    this.getPage(this.currentPage);
  }

  getPreviousPage() {
    this.getPage(this.previousPage); 
  }

  getNextPage() {
    this.getPage(this.nextPage);
  }

  async abrirModal(editable: boolean, agregable: boolean) {
    let myEvent = new EventEmitter();
    myEvent.subscribe(res => {
      console.log(res);
      modal.dismiss();
      this.addElement(res);
    });

    const modal = await this.modalController.create({
      component: ProductInputPage,
      componentProps:{
        id: 0,
        name: "",
        price: "",
        discontinued: true,
        edit: editable,
        agregar: agregable,
        element: myEvent
      }
    });
    return await modal.present();
  }

}
