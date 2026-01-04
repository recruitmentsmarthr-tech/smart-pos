FROM node:22-alpine
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
RUN npm install -g serve # Install serve globally
COPY . .
RUN npm run build # Build the application for production
EXPOSE 3000 # Expose the port serve will listen on
CMD ["serve", "-s", "dist", "-l", "3000"] # Serve the static files from the dist folder