# Development Reference
Geochemical Gateway portal page rewrite for modern systems.

## Running locally
### Running the frontend only
This is incredibly useful if you're just working on a portion of the site and don't need the backend running. Doesn't run inside of a container at all.
```sh
make frontend # Runs 'npm run dev' in the frontend folder
```

### Running a minimal stack
Useful for quickly weeding out any errors before a deployment as well as making sure the backend is working as expected. This is the preferred way of testing out the backend and to be clear it does run in a container. To bypass auth and develop the full stack application locally, access the page via `http://127.0.0.1:4000` instead of `http://localhost:4000`.
```sh
make up # Builds and spins up the frontend and backend components with a Docker Compose
make down # Shutsdown all of the Docker Compose containers
make logs # Get the logs from the Docker Compose deployment
```

### Simulating a prod environment
This one is mainly useful locally if you're wanting to see if a healthcheck is failing or some other broader *deployment* issue is happening. You should be testing your application with this (w/ IU's VPN for the database connection) before making a PR.
```sh
make deploy # Simulates a deployment on your local, single node Docker Swarm Cluster
```

## Todo
### Application
- [x] Rewrite React components in [IU's Rivet Design System](https://rivet.iu.edu/)
- [x] FastAPI backend
  - [x] Serve SPA
  - [x] Handle Auth
  - [ ] Handle legacy PHP applications 
- [x] CILogon Credentials

### Infrastructure
- [ ] Docker Swarm Deployments
  - [x] Basic Green-Blue Docker Stack Setup
  - [x] Healthchecks for smooth failover
  - [ ] Caddy Reverse Proxying to Service (not to Containers!)
     
### CI/CD
- [x] Local development environment
  - [x] Local Docker Compose build and testing
  - [x] Local Docker Swarm deploy (simulate prod environment)
- [ ] Remote CI/CD
  - [ ] Basic GitOps to build image from main
  - [ ] Automatic image pulling (Watchtower)

### Why These Changes Matter
#### Application
These changes aim to bring the gateway in line with IU’s standards for branding, accessibility, and user experience. By integrating CILogon’s OIDC backend, we can securely authenticate users from various institutions. The ultimate goal is to phase out legacy PHP applications in favor of lightweight Python applets that are easier to maintain and better suited for modern backend infrastructure.
#### Infrastructure
The goal of using Docker Swarm is to introduce fault tolerance and orchestration without the full complexity of systems like Kubernetes. Healthchecks are integrated into the deployment process to reduce risk; if an image fails, it won’t be promoted to serve traffic. Once services are reverse proxied through Caddy, SSL certificate management becomes automatic, removing the need for manual upkeep and reducing the potential for configuration errors or downtime.
#### CI/CD
By utilizing the Makefile, you can establish a fully local "prod" environment, assuming you are running Docker Swarm locally (which can be done by simply doing `docker swarm init`). This let's you test a complete environment locally without having to rely on Jetstream2. Eventually the goal is to implement a full GitOps pipeline so that touching the production server(s) is restricted to specialty cases only with all new updates being completely automated. Watchtower would handle pulling the images with Github Actions used to push the container images to Docker Hub or a similar registry.
