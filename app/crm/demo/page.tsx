import {Header} from '@/app/marketplace';
import CrmWorkspace from '../workspace';
import {demoCrm} from '@/lib/crm-demo';
export const metadata={title:'Демонстрация CRM',robots:{index:false,follow:false}};
export default function DemoCrmPage(){return <><Header/><CrmWorkspace initial={demoCrm} demo/></>;}
