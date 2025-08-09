# VisionFlex - Personal Trainer AI

A browser-based AI-powered personal trainer that uses your webcam to track movements, count repetitions, and provide real-time feedback on exercise form.

## 🚀 Features

- **Real-time Pose Detection**: Advanced AI-powered movement tracking using TensorFlow.js and MoveNet
- **Automatic Rep Counting**: Intelligent repetition counting with high accuracy
- **Form Feedback**: Instant guidance and corrections for proper exercise technique
- **Exercise Variety**: Support for Squats and Bicep Curls with more exercises coming
- **Pose Visualization**: Live skeleton overlay on video feed for better form awareness
- **Workout Timer**: Track your workout duration and session progress
- **Responsive Design**: Seamless experience across desktop and mobile devices
- **Camera Integration**: Optimized webcam processing with smooth permission handling
- **Workout Summary**: Comprehensive performance analytics after each session
- **Exercise Instructions**: Built-in guidance and tips for proper form execution

## 🛠️ Tech Stack

- **Frontend**: React 19 with React Router v7
- **Styling**: Tailwind CSS v4
- **Build Tool**: Vite
- **AI/ML**: TensorFlow.js (ready for integration)
- **Pose Detection**: MoveNet (ready for integration)
- **TypeScript**: Full type safety

## 📁 Project Structure

```
app/
├── components/          # Reusable UI components
│   ├── ExerciseCard.tsx
│   ├── Button.tsx
│   ├── LoadingSpinner.tsx
│   └── index.ts
├── constants/          # Application constants
│   └── exercises.ts
├── hooks/              # Custom React hooks
│   ├── useWebcam.ts
│   └── useTimer.ts
├── routes/             # Page components
│   ├── home.tsx        # Exercise selection page
│   ├── workout.tsx     # Workout session page
│   └── summary.tsx     # Workout summary page
├── types/              # TypeScript type definitions
│   └── exercise.ts
├── utils/              # Utility functions
│   ├── poseAnalysis.ts # Rep counting algorithms
│   └── canvasUtils.ts  # Canvas drawing utilities
└── app.css             # Global styles
```

## 🏃‍♂️ Getting Started

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start development server**:

   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to `http://localhost:5173`

4. **Grant camera permission** when prompted

5. **Select an exercise** and start your workout!

## 🎯 Exercise Types

### Squats

- **Target Muscles**: Quadriceps, Glutes, Hamstrings, Core
- **Difficulty**: Beginner
- **Detection Method**: Hip and knee position tracking

### Bicep Curls

- **Target Muscles**: Biceps, Forearms
- **Difficulty**: Beginner
- **Detection Method**: Elbow angle calculation

## 🧠 AI Implementation

The application features fully integrated AI capabilities:

- **TensorFlow.js Integration**: MoveNet model for real-time pose detection
- **Pose Analysis Utilities**: Advanced algorithms for exercise tracking
- **Rep Counting Logic**: Accurate state machine-based counting system
- **Canvas Drawing**: Real-time skeleton visualization
- **Webcam Integration**: Optimized video processing pipeline
- **Form Analysis**: Real-time exercise form feedback
- **Web Worker Processing**: Optimized ML processing for better performance

## 🎨 Design Principles

- **Clean Architecture**: Separation of concerns with clear folder structure
- **Type Safety**: Full TypeScript implementation
- **Responsive Design**: Mobile-first approach
- **Accessibility**: Semantic HTML and ARIA labels
- **Performance**: Optimized for real-time video processing

## 📱 Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support

**Requirements**:

- Modern browser with WebRTC support
- Camera access permission
- JavaScript enabled

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript checks

### Adding New Exercises

1. Add exercise definition to `app/constants/exercises.ts`
2. Implement rep counting logic in `app/utils/poseAnalysis.ts`
3. Update TypeScript types if needed

## 🚀 Next Steps (Phase 3)

1. **Advanced Form Analysis**: More detailed exercise form feedback
2. **Exercise Library Expansion**: Add support for more complex exercises
3. **Progress Tracking**: User profiles and workout history
4. **Mobile App**: Native mobile application development
5. **Social Features**: Workout sharing and community challenges

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- TensorFlow.js team for the amazing ML framework
- MoveNet model for accurate pose detection
- React Router team for the excellent routing solution
- Tailwind CSS for the utility-first styling approach

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)
