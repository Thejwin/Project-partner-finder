import { useMutation } from '@tanstack/react-query';
import * as reportService from '../services/report.service';

export const useSubmitReport = () => {
  return useMutation({
    mutationFn: reportService.submitReport,
  });
};
