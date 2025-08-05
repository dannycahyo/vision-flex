## Technical Requirement Document (TRD): Personal Trainer AI

**Version**: 1.0  
**Date**: 4 August 2025  
**Related PRD**: 1.0

### 1. System Architecture

The application will be a client-side, single-page application (SPA) running entirely in the browser. No backend is required for the MVP, as all processing is done on the user's device.

- **Frontend Framework**: **React** (with React Router/Remix). This will handle the UI components, state management, and application flow.
- **Machine Learning Library**: **TensorFlow.js**. This allows for running ML models directly in the browser.
- **Styling**: Tailwind CSS or a component library like MUI/Chakra UI for rapid UI development.

### 2. Key Technical Components & Specifications

#### 2.1. Webcam & Video Processing

- **Webcam Access**: Utilize the `navigator.mediaDevices.getUserMedia()` browser API to access the webcam feed.
- **Video Element**: The live feed will be rendered into an HTML5 `<video>` element.
- **Drawing**: A `<canvas>` element will be layered on top of the `<video>` element to draw the pose estimation skeleton and other UI feedback. The drawing will be synchronized with the video frames using `requestAnimationFrame` for smooth rendering.

#### 2.2. Pose Estimation

- **Model**: **MoveNet (Lightning)** from the `@tensorflow-models/pose-detection` library, specifically we will use the `Lightning` version. It is chosen for its high speed and sufficient accuracy for this use case, making it ideal for real-time applications on most devices.
- **Implementation**:
  1.  Load the MoveNet model when the workout component mounts.
  2.  In a `requestAnimationFrame` loop, pass the current video frame to the model to get keypoint data (an array of 17 body points with `x`, `y` coordinates and a confidence score).
  3.  Draw the keypoints and connecting lines onto the canvas.

#### 2.3. Rep Counting Algorithm

The logic will be implemented as a state machine for each exercise.

- **Squat Rep Logic**:
  1.  **State**: `up` or `down`. The initial state is `up`.
  2.  **Keypoints**: Track the `y` coordinates of the hips and knees.
  3.  **Logic**:
      - If the user is in the `up` state and their hip `y` coordinate drops significantly below their knee `y` coordinate (i.e., they perform a deep squat), change the state to `down`.
      - If the user is in the `down` state and their hip `y` coordinate rises above their knee `y` coordinate, increment the rep counter by 1 and change the state back to `up`.

- **Bicep Curl Rep Logic**:
  1.  **State**: `extended` or `contracted`. Initial state is `extended`.
  2.  **Keypoints**: Track the shoulder, elbow, and wrist to calculate the angle of the elbow joint. The angle can be found using the law of cosines from the coordinates.
  3.  **Logic**:
      - If in `extended` state (angle > 160°) and the angle becomes less than a threshold (e.g., 45°), change state to `contracted`.
      - If in `contracted` state and the angle goes above 160°, increment rep count and change state to `extended`.

#### 2.4. Form Correction Logic

- This logic runs concurrently with the rep counter.
- **Squat Form Check**:
  - **"Go Lower"**: If the user's hips descend but do not pass the required `down` threshold before returning up, flash a "Go Lower" message.
  - **"Keep Knees Apart"**: (Advanced) Check if the distance between the knees narrows significantly during the `down` state.

### 3. Performance & Optimization

- **Model Performance**: Use the `Lightning` version of MoveNet as it is optimized for speed.
- **Offload to Web Worker**: To prevent the UI from freezing while the model is processing, the pose estimation logic can be run inside a **Web Worker**. The main thread sends video frames to the worker, and the worker sends keypoint data back.
- **Frame Rate**: Throttle the processing to 15-20 frames per second if performance is an issue, as this is sufficient for smooth tracking.

### 4. Core Dependencies

- `react`, `react-dom`, `react-router-dom`
- `@tensorflow/tfjs`
- `@tensorflow-models/pose-detection`
- `tailwindcss`

### 5. Pages / Views

The application will be built as a Single Page Application (SPA) using a file-based router to manage different views. This provides a fluid, app-like experience while maintaining a scalable and organized code structure with distinct URLs for each view.

#### 5.1. `/` (Home & Exercise Selection)

- **Purpose**: This is the application's landing page. It serves to welcome the user, handle the initial webcam permission request, and allow the user to choose their desired exercise.
- **Key Components**:
  - A welcome/introductory message.
  - A grid or list of "Exercise Cards" (e.g., Squats, Push-ups).
  - A button on each card to start the selected workout.
- **Technical Logic**:
  - On page load, it will trigger the `navigator.mediaDevices.getUserMedia()` API to request camera access. A user-friendly message will be displayed while waiting for permission or if permission is denied.
  - The list of exercises can be generated from a simple array of objects.
  - Clicking an exercise card will use the router to navigate the user to the workout page, passing the selected exercise as a parameter.

#### 5.2. `/workout/[exercise]` (Workout View)

- **Purpose**: This is the core interactive screen where the user performs the workout. The URL will be dynamic based on the user's choice (e.g., `/workout/squats`).
- **Key Components**:
  - The main video display showing the user's webcam feed.
  - A canvas element layered on top to render the pose estimation skeleton.
  - A real-time data overlay to display the **rep count**, a **timer**, and **form feedback messages** (e.g., "Great Rep!").
  - A "Pause" and "End Workout" button.
- **Technical Logic**:
  - This page will read the `[exercise]` parameter from the URL to load the correct rep counting and form correction logic.
  - It will initialize and run the **MoveNet** model in a `requestAnimationFrame` loop to continuously analyze the video feed.
  - All rep counting and form analysis state will be managed locally within this component.
  - Clicking "End Workout" will navigate the user to the summary page, passing the final session data (total reps, time) via state.

#### 5.3. `/summary` (Workout Summary View)

- **Purpose**: To present a summary of the completed workout session. This screen provides positive reinforcement and a sense of accomplishment.
- **Key Components**:
  - A summary card displaying:
    - Exercise Performed (e.g., "Squats").
    - Total Reps.
    - Total Duration.
  - A "Start Another Workout" or "Home" button to return to the exercise selection page.
- **Technical Logic**:
  - This page will receive the workout data from the Workout View via the router's state or a global state manager (like React Context).
  - It does not need to access the webcam or run the ML model. The camera stream should be stopped when the user navigates away from the `/workout` page to free up resources.
