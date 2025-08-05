import {
  type RouteConfig,
  index,
  route,
} from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('workout/:exercise', 'routes/workout.tsx'),
  route('summary', 'routes/summary.tsx'),
] satisfies RouteConfig;
