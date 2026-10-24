import React from 'react';
import { PersianBottomSheet } from '../common/PersianBottomSheet';

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const BottomSheetBase: React.FC<Props> = ({ visible, title, onClose, children, footer }) => {
  return (
    <PersianBottomSheet
      visible={visible}
      title={title}
      onClose={onClose}
      footer={footer}
    >
      {children}
    </PersianBottomSheet>
  );
};

export default BottomSheetBase;