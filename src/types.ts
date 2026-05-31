/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ExamCategoryType = 'RSMSSB_BCI' | 'RSMSSB_SCI' | 'UP_LT_GRADE' | 'UGC_NET_CS';

export interface ExamInfo {
  id: ExamCategoryType;
  title: string;
  subtitle: string;
  badge: string;
  totalUnits: number;
  description: string;
  thumbnailColor: string;
}

export interface HandwrittenPage {
  pageNumber: number;
  title?: string;
  paragraphs: string[];
  drawings?: {
    type: 'gate' | 'flow' | 'table' | 'formula';
    title: string;
    items: string[];
  }[];
}

export interface NotesUnit {
  id: string; // e.g. "ugc-net-unit-3"
  examId: ExamCategoryType;
  unitNumber: number;
  name: string;
  shortDescription: string;
  price: number; // e.g. 20 (₹20)
  demoPages: HandwrittenPage[];
  fullPages: HandwrittenPage[];
}

export interface PurchaseRecord {
  orderId: string;
  name: string;
  email: string;
  unitId: string;
  unitName: string;
  examId: ExamCategoryType;
  price: number;
  status: 'Successful' | 'Pending';
  paymentMethod: string;
  timestamp: string;
}

export interface ContactQuery {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: string;
  replied?: boolean;
}

export interface UserSession {
  name: string;
  email: string;
  isLoggedIn: boolean;
  purchasedUnitIds: string[];
}
