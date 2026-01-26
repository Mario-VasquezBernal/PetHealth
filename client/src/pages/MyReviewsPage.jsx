import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import MyReviews from '../components/MyReviews';

const MyReviewsPage = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader />
        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-4">
            <MyReviews />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyReviewsPage;
