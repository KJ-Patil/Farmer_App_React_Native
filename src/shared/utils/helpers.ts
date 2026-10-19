export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const mobileToEmail = (mobile: string): string => {
  return `${mobile}@farmerledger.com`;
};

export const isValidMobile = (mobile: string): boolean => {
  return /^[6-9]\d{9}$/.test(mobile);
};

export const isValidAadhaar = (aadhaar: string): boolean => {
  return /^\d{12}$/.test(aadhaar);
};

export const isValidPincode = (pincode: string): boolean => {
  return /^\d{6}$/.test(pincode);
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
};

export const isOverdue = (dueDate: string | undefined, pendingAmount: number | undefined): boolean => {
  if (!dueDate || !pendingAmount || pendingAmount <= 0) return false;
  return new Date(dueDate) < new Date();
};

export const calculateNetReceived = (sanctionAmount: number, processingFee: number): number => {
  return sanctionAmount - processingFee;
};

export const CSV_BOM = '﻿';
