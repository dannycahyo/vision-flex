# VisionFlex - Personal Trainer AI

A browser-based AI-powered personal trainer that uses your webcam to track movements, count repetitions, and provide real-time feedback on exercise form.

## 🚀 Features

### Current Implementation (Phase 1 - UI Complete)

- **Exercise Selection**: Choose from Squats, Bicep Curls, and Push-ups
- **Responsive Design**: Works on desktop and mobile devices
- **Camera Permission Handling**: Smooth user experience for webcam access
- **Workout Timer**: Track your workout duration
- **Exercise Instructions**: Built-in guidance for proper form
- **Workout Summary**: View your performance after each session

### Upcoming Features (Phase 2 - AI Integration)

- **Real-time Pose Detection**: Using TensorFlow.js and MoveNet
- **Automatic Rep Counting**: AI-powered repetition counting
- **Form Feedback**: Real-time guidance for proper exercise form
- **Pose Visualization**: Skeleton overlay on video feed

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

### Push-ups

- **Target Muscles**: Chest, Shoulders, Triceps, Core
- **Difficulty**: Intermediate
- **Detection Method**: Shoulder and elbow alignment

## 🧠 AI Implementation (Ready for Phase 2)

The codebase is prepared for AI integration with:

- **Pose Analysis Utilities**: Pre-built algorithms for each exercise
- **Rep Counting Logic**: State machines for accurate counting
- **Canvas Drawing**: Skeleton visualization system
- **Webcam Integration**: Optimized video processing pipeline

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

## 🚀 Next Steps (Phase 2)

1. **Integrate TensorFlow.js**: Load MoveNet model in workout component
2. **Implement Pose Detection**: Real-time pose estimation pipeline
3. **Add Rep Counting**: Connect pose data to counting algorithms
4. **Form Feedback**: Real-time exercise form analysis
5. **Performance Optimization**: Web Workers for ML processing

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
