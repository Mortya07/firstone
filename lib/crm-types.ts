export const stages=['Новая заявка','Обсуждение','Смета','Договор','В работе','Завершено','Отказ'] as const;
export type Stage=typeof stages[number];
export const plans=[
  {id:'start',name:'Старт',caption:'Для первых заказов',clients:50,deals:100,tasks:200},
  {id:'brigade',name:'Бригада',caption:'Для регулярной работы',clients:200,deals:300,tasks:800},
  {id:'company',name:'Компания',caption:'Для большого потока заказов',clients:500,deals:750,tasks:1500},
  {id:'pro',name:'Профи',caption:'Для расширенной базы проектов',clients:1000,deals:1500,tasks:3000},
] as const;
export type PlanId=typeof plans[number]['id'];
export type CrmClient={id:string;name:string;phone:string;notes:string;updatedAt:number};
export type CrmDeal={id:string;clientId:string;title:string;workType:string;stage:Stage;budget:number;address:string;notes:string;updatedAt:number};
export type CrmTask={id:string;dealId:string;title:string;assignee:string;dueDate:string;done:boolean;updatedAt:number};
export type CrmData={clients:CrmClient[];deals:CrmDeal[];tasks:CrmTask[]};
export type CrmAccess={plan:PlanId;activeUntil:number};
export type SaveRecord={entity:'client'|'deal'|'task';id?:string;data:Record<string,unknown>};
