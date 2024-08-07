import { TestBed } from '@angular/core/testing'

import { ApiService } from './api.service'

describe('ApiService', () => {
  let service: ApiService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(ApiService)
  })

  // it('should be created', () => {
  //   expect(service).toBeTruthy();
  // });

  it('sair da fila', () => {
    const client = 'client'
    const id = 1
    const x = service.deleteCallBartender(client, id)

    expect(x).toBeTruthy()
  })
})
