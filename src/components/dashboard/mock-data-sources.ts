import { DataSourceDefinition } from "./types";

export const AVAILABLE_DATA_SOURCES: DataSourceDefinition[] = [
  {
    id: "seo",
    name: "SEO e Visibilidade",
    type: "database",
    fields: [
      { key: "id", label: "Total de Eventos", type: "number" },
      { key: "event_name", label: "Nome do Evento", type: "string" },
      { key: "url", label: "URL", type: "string" },
      { key: "created_at", label: "Data do Evento", type: "date" },
    ],
  },
  {
    id: "campaigns",
    name: "Campanhas",
    type: "campaign_context",
    fields: [
      { key: "active", label: "Campanhas Ativas", type: "number" },
      { key: "spend", label: "Investimento Total", type: "currency" },
      { key: "clicks", label: "Total de Cliques", type: "number" },
    ],
  },
  {
    id: "forms",
    name: "Formulários",
    category: "Formulários e Checkout",
    type: "form_context",
    fields: [
      { key: "form_name", label: "Nome do Formulário", type: "string" },
      { key: "submitted_at", label: "Data de Envio", type: "date" },
      { key: "email", label: "Email", type: "string" },
      { key: "status", label: "Status", type: "string" },
      { key: "amount", label: "Valor (Checkout)", type: "currency" },
    ],
  },
  {
    id: "database_leads",
    name: "Leads",
    category: "Fontes de Dados",
    type: "database",
    fields: [
      { key: "lead_name", label: "Nome", type: "string" },
      { key: "status", label: "Status", type: "string" },
      { key: "value", label: "Valor", type: "currency" },
      { key: "created_at", label: "Data de Criação", type: "date" },
      { key: "source", label: "Origem", type: "string" },
    ],
  },
  {
    id: "database_deals",
    name: "Oportunidades",
    category: "Fontes de Dados",
    type: "database",
    fields: [
      { key: "deal_name", label: "Nome", type: "string" },
      { key: "stage", label: "Estágio", type: "string" },
      { key: "value", label: "Valor", type: "currency" },
      { key: "close_date", label: "Previsão", type: "date" },
    ],
  },
  {
    id: "database_contacts",
    name: "Contatos",
    category: "Fontes de Dados",
    type: "database",
    fields: [
      { key: "name", label: "Nome", type: "string" },
      { key: "email", label: "Email", type: "string" },
      { key: "phone", label: "Telefone", type: "string" },
      { key: "created_at", label: "Data de Cadastro", type: "date" },
    ],
  },
  {
    id: "database_general",
    name: "Geral",
    category: "Bases de Dados",
    type: "database",
    fields: [
      { key: "db_name", label: "Nome da Base", type: "string" },
      { key: "records", label: "Registros", type: "number" },
      { key: "size", label: "Tamanho", type: "string" },
      { key: "last_updated", label: "Última Atualização", type: "date" },
    ],
  },
  {
      id: "cms",
      name: "Geral",
      category: "Conteúdo CMS",
      type: "database",
      fields: [
          { key: "entries", label: "Total de Entradas", type: "number" },
          { key: "collections", label: "Coleções", type: "number" }
      ]
  }
];
