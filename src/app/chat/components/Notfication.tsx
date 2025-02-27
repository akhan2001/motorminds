// /components/Notification.tsx
import { toast } from 'react-toastify';

const notify = (message: string) => {
    toast(message);
};

export default notify;