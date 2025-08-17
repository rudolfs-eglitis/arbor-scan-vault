import ArborQuantApp from '@/components/ArborQuantApp';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const Index = () => {
  return (
    <ProtectedRoute>
      <ArborQuantApp />
    </ProtectedRoute>
  );
};

export default Index;
