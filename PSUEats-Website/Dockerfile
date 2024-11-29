# Step 1: Use the official Node.js image as the base image
FROM node:18

# Step 2: Set the working directory in the container
WORKDIR /app

# Step 3: Copy application files into the working directory
COPY . .

# Step 4: Install application dependencies
RUN npm install

# Step 5: Expose the port your app listens on
EXPOSE 3000

# Step 6: Define the command to run your app
CMD ["npm", "start"]
