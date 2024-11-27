export function formatDDIBotMessage({ language }: { language: string }) {
  let ddi;
  switch (language) {
    case "pt-BR":
      ddi = "55";
      break;
    case "pt-PT":
      ddi = "351";
      break;
    case "fr-CH":
      ddi = "41";
      break;
    case "ar-AE":
      ddi = "971";
      break;
    case "en-US":
      ddi = "1";
      break;
      case 'en-GB':
        ddi = "44"
      break
  }
  return { ddi };
}
