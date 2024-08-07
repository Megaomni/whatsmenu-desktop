import { ComponentFixture, TestBed } from '@angular/core/testing'

import { TablesComponent } from './tables.component'
import { ProfileType } from 'src/app/profile-type'
import { profile } from 'src/test/utils/profile'
import Table from 'src/classes/table'
import { of } from 'rxjs'
import { Component } from '@angular/core'

describe('TablesComponent', () => {
  let component: TablesComponent
  let fixture: ComponentFixture<TablesComponent>
  let openDialogSpy: jasmine.Spy
  let toastServiceSpy: jasmine.Spy
  let table: Table
  let getTableSpy: jasmine.Spy
  let emitTableSpy: jasmine.Spy

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TablesComponent],
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(TablesComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    component.context.profile = profile as unknown as ProfileType
    component.context.profile.options.table.persistBartender = false
    component.context.tables = component.context.profile.tables.map((table) => new Table(table))
    table = component.context.tables[0]
    openDialogSpy = spyOn(component['matDialog'], 'open')
    toastServiceSpy = spyOn(component.toastService, 'show')
    getTableSpy = spyOn(component.api, 'getTable').and.returnValue(table as any)
    emitTableSpy = spyOn(component, 'emitTable')
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });

  // // setActiveTable
  // it('should be possible to get and set a table to pdv', async () => {
  //   component.pageType = 'pdv'
  //   await component.setActiveTable(table)
  //   expect(getTableSpy).toHaveBeenCalledWith(table.id)
  //   expect(emitTableSpy).toHaveBeenCalledWith(table)
  // })

  // it('should be possible to get and set a table to bartender with persistBartender option', async () => {
  //   component.context.profile.options.table.persistBartender = true
  //   sessionStorage.setItem('bartenderId', component.context.profile.bartenders[0].id.toString())
  //   component.pageType = 'bartender'
  //   console.log(sessionStorage);
  //   await component.setActiveTable(table)
  //   expect(getTableSpy).toHaveBeenCalledWith(table.id)
  //   expect(emitTableSpy).toHaveBeenCalledWith(table)
  // })

  // it('should be not possible to get and set a table to bartender if table is paused', async () => {
  //   component.context.profile.options.table.persistBartender = true
  //   sessionStorage.setItem('bartenderId', component.context.profile.bartenders[0].id.toString())
  //   getTableSpy = getTableSpy.and.returnValue({ ...table, status: false } as any)
  //   component.pageType = 'bartender'
  //   await component.setActiveTable(table)
  //   expect(getTableSpy).toHaveBeenCalledWith(table.id)
  //   expect(emitTableSpy).not.toHaveBeenCalled()
  //   expect(toastServiceSpy).toHaveBeenCalledWith(jasmine.stringMatching('Mesa pausada'), jasmine.objectContaining({}))
  // })

  // it('should be possible to get and set a table to bartender with login option', async () => {
  //   openDialogSpy = openDialogSpy.and.returnValue({
  //     afterClosed: () => of({ authenticated: true, table })
  //   })
  //   component.pageType = 'bartender'
  //   await component.setActiveTable(table)
  //   expect(getTableSpy).toHaveBeenCalledWith(table.id)
  //   expect(emitTableSpy).toHaveBeenCalledWith(table)
  // })

  // it('should be not possible to get and set a table to bartender with login option if table is paused', async () => {
  //   openDialogSpy = openDialogSpy.and.returnValue({
  //     afterClosed: () => of({ authenticated: false, table })
  //   })
  //   component.pageType = 'bartender'
  //   await component.setActiveTable(table)
  //   expect(getTableSpy).toHaveBeenCalledWith(table.id)
  //   expect(emitTableSpy).not.toHaveBeenCalledWith(table)
  //   expect(toastServiceSpy).toHaveBeenCalledWith(jasmine.stringMatching('Mesa pausada'), jasmine.objectContaining({}))
  // })

  it('selecionar mesa e sair do espera de atendimento', () => {
    const x = component.setActiveTable(table)

    expect(x).toBe(true)
  })
})
