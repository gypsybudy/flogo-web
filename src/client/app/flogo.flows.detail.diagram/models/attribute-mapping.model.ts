import { FLOGO_TASK_ATTRIBUTE_TYPE } from '../../core/constants';

export interface IFlogoFlowDiagramTaskAttributeMapping {
  type: FLOGO_TASK_ATTRIBUTE_TYPE;
  value: string;
  mapTo: string;
}
