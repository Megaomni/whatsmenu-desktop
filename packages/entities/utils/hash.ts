/**
 * Retorna um hash aleatório com o tamanho especificado.
 * Caso nenhum tamanho seja especificado, retorna um hash com 6 caracteres.
 * @param {number} [length=6] - O tamanho do hash a ser gerado.
 * @returns {string} - O hash gerado.
 */
export const hash = (length: number = 6): string => {
	var result = ''
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	var charactersLength = characters.length
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength))
	}
	return result
}