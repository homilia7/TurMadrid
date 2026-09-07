import { onRequestGet as __api_data_ts_onRequestGet } from "C:\\Users\\User\\Desktop\\GeoSoft\\TurMadrid\\functions\\api\\data.ts"
import { onRequestDelete as __api_documents_ts_onRequestDelete } from "C:\\Users\\User\\Desktop\\GeoSoft\\TurMadrid\\functions\\api\\documents.ts"
import { onRequestGet as __api_documents_ts_onRequestGet } from "C:\\Users\\User\\Desktop\\GeoSoft\\TurMadrid\\functions\\api\\documents.ts"
import { onRequestOptions as __api_documents_ts_onRequestOptions } from "C:\\Users\\User\\Desktop\\GeoSoft\\TurMadrid\\functions\\api\\documents.ts"
import { onRequestPost as __api_documents_ts_onRequestPost } from "C:\\Users\\User\\Desktop\\GeoSoft\\TurMadrid\\functions\\api\\documents.ts"
import { onRequestOptions as __api_sync_ts_onRequestOptions } from "C:\\Users\\User\\Desktop\\GeoSoft\\TurMadrid\\functions\\api\\sync.ts"
import { onRequestPost as __api_sync_ts_onRequestPost } from "C:\\Users\\User\\Desktop\\GeoSoft\\TurMadrid\\functions\\api\\sync.ts"
import { onRequestGet as __api_travelers_ts_onRequestGet } from "C:\\Users\\User\\Desktop\\GeoSoft\\TurMadrid\\functions\\api\\travelers.ts"
import { onRequestOptions as __api_travelers_ts_onRequestOptions } from "C:\\Users\\User\\Desktop\\GeoSoft\\TurMadrid\\functions\\api\\travelers.ts"
import { onRequestPost as __api_travelers_ts_onRequestPost } from "C:\\Users\\User\\Desktop\\GeoSoft\\TurMadrid\\functions\\api\\travelers.ts"

export const routes = [
    {
      routePath: "/api/data",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_data_ts_onRequestGet],
    },
  {
      routePath: "/api/documents",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_documents_ts_onRequestDelete],
    },
  {
      routePath: "/api/documents",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_documents_ts_onRequestGet],
    },
  {
      routePath: "/api/documents",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_documents_ts_onRequestOptions],
    },
  {
      routePath: "/api/documents",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_documents_ts_onRequestPost],
    },
  {
      routePath: "/api/sync",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_sync_ts_onRequestOptions],
    },
  {
      routePath: "/api/sync",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_sync_ts_onRequestPost],
    },
  {
      routePath: "/api/travelers",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_travelers_ts_onRequestGet],
    },
  {
      routePath: "/api/travelers",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_travelers_ts_onRequestOptions],
    },
  {
      routePath: "/api/travelers",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_travelers_ts_onRequestPost],
    },
  ]