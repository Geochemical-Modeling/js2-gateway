# Development Reference
Geochemical Gateway portal page rewrite for modern systems.


### Issues

#### Things I tried to fix
- I made changes to Dockerfile so that uvicorn runs on port 8000, so now we at least know it's running on 8000. But it was already doing that by default?



```bash


# Shows stdout and stderr fro mthe container, including error messages from Python, uv, or uvicorn.
docker log <container-id>

# Loops through all exited containers
docker ps -a --filter "status=exited" --format '{{.ID}} {{.Names}}' | while read id name; do
  echo "=== Logs for $name ==="
  docker logs "$id"
  echo ""
done


docker service ls

# Since we're using docker swarm, let's get the logs from a service
docker service logs js2-gateway-stack_app

# Or a specific task/container in that service
docker logs $(docker ps -q --filter "name=js2-gateway-stack_app.1.slnd0smqalrmk237e6xf8kgmj")
```


#### Things to keep track of
- I think we should uniformalize the error messages that we send. I'm wondering if FastAPI does that, or I'd have to send back a response, and create the JSON for that response. I'd have to create some utils then.


- H2S probably won't be able to be re-written because it relies on Scipy's grid interpolation data, more specifically for ungridded (unstructured) data. JS doesn't have anything for that, and you'd have to build it yourself.
- CO2 Calculator is close to done, we just need the frontend and backend to integrate together then format the text.
- RateCalculator or rate constants. It's something rate related, but the idea is most of the data processing can be client side.
- `make logs` doesn't seem useful, it didn't output anything.





## Running locally
### Running the frontend only
This is incredibly useful if you're just working on a portion of the site and don't need the backend running. Doesn't run inside of a container at all.
```sh
make frontend # Runs 'npm run dev' in the frontend folder
```

### Running a minimal stack
Useful for quickly weeding out any errors before a deployment as well as making sure the backend is working as expected. This is the preferred way of testing out the backend and to be clear it does run in a container.
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
  - [ ] Handle Auth
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
