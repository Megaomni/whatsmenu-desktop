import { createElement } from "react"
import { renderToString } from "react-dom/server"
import { NotePrint } from "../components/NotePrint"
import { ProductionPrint } from "../components/ProductionPrint"

type PrintToStringProps = {
	cart: any,
	profile: any,
	table: any,
	printType: any,
	command: any,
	html: boolean,
	electron: boolean
	motoboys: any[]
	isGeneric?: boolean
}

type ComponentToPrint = typeof NotePrint | typeof ProductionPrint

export const printToString = (Component: ComponentToPrint, {
	cart,
	profile,
	table,
	printType,
	command,
	html = false,
	electron = false,
	isGeneric
}: PrintToStringProps) => {
	if (!electron) {
		profile.options.print.textOnly = true
		isGeneric = profile.options.print.textOnly
	}
	const props: Partial<PrintToStringProps> = {
		// cart: new Cart(cart),
		cart,
		profile,
		table,
		// table: table ? new Table(table) : table,
		command,
		// command: command ? new Command(command) : command,
		printType,
		electron,
		motoboys: [],
		isGeneric
	}
	const layout58 = renderToString(createElement(Component, { ...props, paperSize: 58 } as any))
	const layout80 = renderToString(createElement(Component, { ...props, paperSize: 80 } as any))
	const reactComponentString: { [key: '58' | '80' | string]: string } = {
		58: html
			? layout58
			: layout58
				.replace(/<[^>]+>/g, '')
				.replaceAll('\u00A0', ' ')
				.match(/.{1,32}/gmu)
				?.join('\n') || '',
		80: html
			? layout80
			: layout80
				.replace(/<[^>]+>/g, '')
				.replaceAll('\u00A0', ' ')
				.match(/.{1,48}/gmu)
				?.join('\n') || '',
		requestId: cart.id,
	}

	return reactComponentString
}