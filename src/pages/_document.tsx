import { FacebookPixel } from "@components/FacebookPix"
import Document, { Html, Head, Main, NextScript } from "next/document"

export default class MyDocument extends Document {
    render() {
        return (
            <Html>
                <Head lang="pt-br">
                    <meta httpEquiv="Content-Language" content="pt-br" />
                    <link href="https://fonts.gstatic.com" rel="preconnect" />
                    <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i,700,700i|Nunito:300,300i,400,400i,600,600i,700,700i|Poppins:300,300i,400,400i,500,500i,600,600i,700,700i&display=swap" rel="stylesheet" />
                    <link rel="icon" type="image/x-icon" href="/images/favicon.png"></link>
                    <script src="https://www.youtube.com/iframe_api" defer></script>
                    <FacebookPixel />
                </Head>
                <body id="body-application">
                    <div id="body-application-container">
                        <Main />
                        <NextScript />
                    </div>
                </body>
            </Html>
        )
    }
}