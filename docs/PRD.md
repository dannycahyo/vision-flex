## Product Requirement Document (PRD): Personal Trainer AI

**Version**: 1.0  
**Date**: 4 August 2025  
**Author**: Gemini AI

### 1. Introduction & Vision

The **Personal Trainer AI** is a browser-based application that acts as a virtual workout partner. It uses a device's webcam to track a user's movements, automatically count exercise repetitions, and provide real-time feedback on form. The vision is to make home workouts more effective and engaging by providing the guidance and accountability of a personal trainer, accessible to anyone with a computer.

### 2. Target Audience

- **Beginners & Home Fitness Enthusiasts**: Individuals who work out at home and are unsure about proper exercise form or struggle to keep track of their reps.
- **Students & Busy Professionals**: People looking for a quick, efficient, and guided workout session without needing to go to a gym.
- **Tech Enthusiasts**: Users interested in practical applications of AI and machine learning.

### 3. User Goals & Problems

| User Goal                                            | Problem Solved                                                                       |
| :--------------------------------------------------- | :----------------------------------------------------------------------------------- |
| "I want to make sure I'm doing exercises correctly." | The app provides real-time form checks to prevent injury and maximize effectiveness. |
| "I often lose count of my reps."                     | The AI automatically and accurately counts each successful repetition.               |
| "I need motivation to complete my set."              | Real-time feedback and rep counting provide encouragement and a clear goal.          |
| "I want a simple, no-fuss workout tool."             | The app is entirely browser-based, requiring no installation or expensive equipment. |

### 4. Features & Scope

Features are prioritized to guide development from a Minimum Viable Product (MVP) to a more robust application.

#### P0: Must-Have (MVP)

- **Real-time Webcam Feed**: The user must be able to see themselves on screen.
- **Exercise Selection**: User can choose from a small, predefined list of exercises (e.g., Squats, Bicep Curls, Push-ups).
- **AI Pose Overlay**: A skeleton of key body points is drawn over the user's video feed.
- **Automatic Rep Counting**: The core feature. The app must detect and count a valid repetition for the selected exercise.
- **On-screen Feedback**: Display the current rep count and simple messages (e.g., "Great Rep!").

#### P1: Should-Have

- **Real-time Form Correction**: The app provides simple, actionable feedback if the user's form is incorrect (e.g., "Go lower on your squat," "Keep your back straight").
- **Workout Controls**: Ability to start, pause, and end a workout session.
- **Workout Summary**: After a session, display a summary screen with total reps and duration.

#### P2: Nice-to-Have (Future Scope)

- **Expanded Exercise Library**: Add more complex exercises (e.g., Lunges, Overhead Press).
- **Audio Feedback**: Use voice cues for rep counts and form correction ("3... 4... 5... Good job!").
- **User Profiles & History**: Allow users to save their workout history to track progress over time.

### 5. User Flow

1.  User opens the web application.
2.  The app requests permission to use the webcam.
3.  User is presented with a screen to select an exercise (e.g., "Squats").
4.  The workout screen appears, showing the webcam feed with the pose skeleton overlay.
5.  User starts performing the exercise. The app counts reps and provides feedback.
6.  User finishes their set and clicks the "End Workout" button.
7.  A summary screen shows the results of the session.
