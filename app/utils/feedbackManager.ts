import type {
  FormFeedback,
  FeedbackPriority,
  EnhancedRepCounterState,
} from '~/types/exercise';

/**
 * Priority levels for form feedback (higher number = higher priority)
 */
const PRIORITY_LEVELS: Record<FeedbackPriority, number> = {
  critical: 4, // Safety issues, visibility problems
  important: 3, // Form corrections that affect exercise effectiveness
  helpful: 2, // General guidance and tips
  encouragement: 1, // Positive reinforcement
};

/**
 * Default minimum display duration for each priority level (in milliseconds)
 */
const DEFAULT_MIN_DURATION: Record<FeedbackPriority, number> = {
  critical: 3000, // 3 seconds for critical feedback
  important: 2500, // 2.5 seconds for important corrections
  helpful: 2000, // 2 seconds for helpful tips
  encouragement: 1500, // 1.5 seconds for encouragement
};

/**
 * Pre-defined feedback messages organized by exercise and category
 */
export const FEEDBACK_MESSAGES = {
  squats: {
    visibility: {
      message: 'Position yourself so your hips and knees are visible',
      priority: 'critical' as FeedbackPriority,
    },
    stance: {
      message:
        'Keep your knees aligned with your feet, slightly wider stance',
      priority: 'important' as FeedbackPriority,
    },
    depth: {
      shallow: {
        message:
          'Try to squat deeper, aim for thighs parallel to ground',
        priority: 'important' as FeedbackPriority,
      },
      good: {
        message: 'Good depth! Hold for a moment at the bottom',
        priority: 'encouragement' as FeedbackPriority,
      },
    },
    movement: {
      descending: {
        message: 'Begin lowering into your squat, keep chest up',
        priority: 'helpful' as FeedbackPriority,
      },
      ascending: {
        message: 'Push through your heels to stand back up',
        priority: 'helpful' as FeedbackPriority,
      },
      completed: {
        message: 'Good! Keep your back straight for the next rep',
        priority: 'encouragement' as FeedbackPriority,
      },
    },
  },
  bicepCurls: {
    visibility: {
      message: 'Position yourself so your arms are visible',
      priority: 'critical' as FeedbackPriority,
    },
    armSync: {
      message: 'Try to keep both arms moving at the same pace',
      priority: 'important' as FeedbackPriority,
    },
    elbowPosition: {
      message: 'Keep your elbow close to your body',
      priority: 'important' as FeedbackPriority,
    },
    movement: {
      contracting: {
        message: 'Continue curling upward',
        priority: 'helpful' as FeedbackPriority,
      },
      extending: {
        message: 'Slowly lower your arm',
        priority: 'helpful' as FeedbackPriority,
      },
      topPosition: {
        message: 'Good contraction! Hold briefly at the top',
        priority: 'encouragement' as FeedbackPriority,
      },
      bottomPosition: {
        message: 'Good extension! Control the downward movement',
        priority: 'encouragement' as FeedbackPriority,
      },
    },
  },
};

/**
 * Creates a new FormFeedback object with timestamp and priority
 */
export function createFeedback(
  message: string,
  priority: FeedbackPriority,
  minDisplayDuration?: number,
): FormFeedback {
  return {
    message,
    priority,
    timestamp: Date.now(),
    minDisplayDuration:
      minDisplayDuration || DEFAULT_MIN_DURATION[priority],
  };
}

/**
 * Determines if new feedback should replace current feedback based on priority and timing
 */
export function shouldUpdateFeedback(
  currentFeedback: FormFeedback | null,
  newFeedback: FormFeedback,
  minFeedbackInterval: number = 1000, // Minimum time between feedback changes
): boolean {
  if (!currentFeedback) {
    return true;
  }

  const now = Date.now();
  const timeSinceLastFeedback = now - currentFeedback.timestamp;
  const minDuration =
    currentFeedback.minDisplayDuration ||
    DEFAULT_MIN_DURATION[currentFeedback.priority];

  // Always respect minimum display duration
  if (timeSinceLastFeedback < minDuration) {
    return false;
  }

  // Check if enough time has passed since last feedback change
  if (timeSinceLastFeedback < minFeedbackInterval) {
    return false;
  }

  // Allow update if new feedback has higher priority
  const currentPriority = PRIORITY_LEVELS[currentFeedback.priority];
  const newPriority = PRIORITY_LEVELS[newFeedback.priority];

  return newPriority >= currentPriority;
}

/**
 * Manages feedback updates with debouncing and prioritization
 */
export function updateFeedbackState(
  currentState: EnhancedRepCounterState,
  potentialFeedback: FormFeedback | null,
): EnhancedRepCounterState {
  if (!potentialFeedback) {
    return currentState;
  }

  // Check if we should update the feedback
  if (
    !shouldUpdateFeedback(
      currentState.activeFeedback,
      potentialFeedback,
    )
  ) {
    return currentState;
  }

  // Update feedback history (keep last 5 feedback messages)
  const updatedHistory = [
    potentialFeedback,
    ...currentState.feedbackHistory.slice(0, 4),
  ];

  return {
    ...currentState,
    activeFeedback: potentialFeedback,
    feedbackHistory: updatedHistory,
    lastFeedbackChange: Date.now(),
    formFeedback: potentialFeedback.message, // Keep backward compatibility
  };
}

/**
 * Gets the appropriate feedback message from the predefined messages
 */
export function getFeedbackFromMap(
  exerciseId: string,
  category: string,
  subcategory?: string,
): FormFeedback | null {
  const exerciseFeedback =
    FEEDBACK_MESSAGES[exerciseId as keyof typeof FEEDBACK_MESSAGES];
  if (!exerciseFeedback) return null;

  let feedbackData: any =
    exerciseFeedback[category as keyof typeof exerciseFeedback];

  if (
    subcategory &&
    feedbackData &&
    typeof feedbackData === 'object' &&
    !feedbackData.message
  ) {
    feedbackData = feedbackData[subcategory];
  }

  if (!feedbackData || !feedbackData.message) return null;

  return createFeedback(feedbackData.message, feedbackData.priority);
}

/**
 * Check if current feedback should expire based on timing
 */
export function shouldExpireFeedback(
  feedback: FormFeedback | null,
  maxFeedbackAge: number = 5000, // 5 seconds max age
): boolean {
  if (!feedback) return false;

  const now = Date.now();
  const age = now - feedback.timestamp;
  const minDuration =
    feedback.minDisplayDuration ||
    DEFAULT_MIN_DURATION[feedback.priority];

  return age > Math.max(minDuration, maxFeedbackAge);
}
