
## Overview
This project implements performance testing using k6, a modern load testing tool. It includes various types of tests such as load, stress, and spike and soak testing, focusing on the sign-up and login functionalities of an API.
# Setup
##### you first need to create log for. Open terminal and follow bellow command
###### For Windows
- mkdir -p log/load log/stress log/spike
###### For Linux
- mkdir -p log/load log/stress log/spike
# Load Tests
##### A load test measures the system's performance under expected traffic conditions, 
##### ensuring that it can handle the anticipated number of users over a prolonged period without degrading
- k6 run load/signup-login.js --console-output=log/load/signup-login.txt


# Soak Tests
##### A soak test is designed to simulate a steady load over a longer period to observe system stability and 
##### performance degradation over time.
- k6 run soak/signup-login.js --console-output=log/soak/signup-login.txt

# Spike Tests
#A spike test involves a sudden increase in load to assess how the system handles unexpected surges in traffic.
- k6 run spike/signup-login.js --console-output=log/spike/signup-login.txt

# Stress Tests
#A stress test pushes the system beyond its capacity limits, 
#identifying the breaking points and how the system recovers from failures.
#This helps in assessing system resilience and ensuring graceful degradation under extreme load.
- k6 run stress/signup-login.js --console-output=log/stress/signup-login.txt

