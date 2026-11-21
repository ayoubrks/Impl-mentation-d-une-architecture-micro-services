# Architecture Micro-Services — Gestion des Factures

Application basée sur une architecture micro-services Spring Boot / Spring Cloud et un client Angular pour la gestion des clients, des produits et des factures.

## Architecture & Ports

| Service | Rôle | Port |
| --- | --- | --- |
| `discovery-service` | Annuaire Eureka Discovery Service | `8761` |
| `config-service` | Spring Cloud Config Server (`./config-repo` ou GitHub) | `9999` |
| `customer-service` | Gestion des clients (Spring Data JPA / REST + H2) | `8081` |
| `inventory-service` | Gestion des produits (Spring Data JPA / REST + H2) | `8082` |
| `billing-service` | Gestion des factures avec **OpenFeign** (`CUSTOMER-SERVICE`, `INVENTORY-SERVICE`) | `8083` |
| `gateway-service` | Spring Cloud Gateway (routage statique & dynamique + CORS) | `8888` |
| `angular-front-app` | Client web Angular | `4200` |

## Ordre de démarrage recommandé

1. **Discovery Service** (`discovery-service` — port `8761`)
2. **Config Service** (`config-service` — port `9999`)
   - Par défaut, le profil `native` lit `./config-repo`.
   - Pour utiliser le dépôt GitHub `https://github.com/mohamedYoussfi/micro-services-app`, lancez avec `-Dspring-boot.run.profiles=git`.
3. **Customer Service** (`customer-service` — port `8081`)
4. **Inventory Service** (`inventory-service` — port `8082`)
5. **Billing Service** (`billing-service` — port `8083`)
6. **Gateway Service** (`gateway-service` — port `8888`)
   - **Routage dynamique** (par défaut) via `DiscoveryClientRouteDefinitionLocator` et Eureka :
     - `http://localhost:8888/customer-service/api/customers`
     - `http://localhost:8888/inventory-service/api/products`
     - `http://localhost:8888/billing-service/fullBills`
   - **Routage statique** (profil `static` via `application-static.yml` et `RouteLocator`) :
     - Lancez avec `-Dspring-boot.run.profiles=static`.
7. **Client Angular** (`angular-front-app` — port `4200`) :
   ```bash
   cd angular-front-app
   npm install
   npm start
   ```
