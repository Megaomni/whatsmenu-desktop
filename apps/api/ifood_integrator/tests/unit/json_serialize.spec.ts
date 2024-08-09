import { test } from '@japa/runner'
import { jsonSerialize } from '../../app/utils/json_serialize.js'

test.group('Json serialize', () => {
  test('Deve ser capaz de deserializar um json em string', async ({ assert }) => {
    const json = '{"key": "value"}'
    const result = jsonSerialize(json)
    assert.deepEqual(result, { key: 'value' })
  })
  test('Caso seja passado um objeto, deve retornar ele mesmo', async ({ assert }) => {
    const json = { key: 'value' }
    const result = jsonSerialize(json)
    assert.deepEqual(result, { key: 'value' })
  })
})
