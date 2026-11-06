import { FireSimulator } from "@/components/fire/fire-simulator";
import { getLocale } from "@/i18n/server";
export default async function Page() { return <FireSimulator locale={await getLocale()} />; }
