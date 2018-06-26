import {Injectable} from '@angular/core';
import { MapperControllerFactory } from '@flogo/flow/shared/mapper';
import { SettingsFormBuilder } from './settings-form-builder';
import { CurrentTriggerState, SettingControlInfo, TriggerInformation } from '../interfaces';
import { Dictionary, SchemaAttribute, TriggerSchema } from '@flogo/core';
import { createValidatorsForSchema } from './settings-validation';
import { TriggerHandler } from '@flogo/flow/core';

@Injectable()
export class ConfigureDetailsService {
  constructor(private settingsFormBuilder: SettingsFormBuilder, private mapperControllerFactory: MapperControllerFactory) {}

  build(state: CurrentTriggerState) {
    const { flowMetadata, schema: triggerSchema, handler: { actionMappings }, fields, trigger: {handlers} } = state;
    const { input, output } = actionMappings;
    const disableCommonSettings = handlers.length > 1;
    const triggerInformation = this.getTriggerInformation(handlers, triggerSchema);
    return {
      settings: this.settingsFormBuilder.build(fields.settings, triggerInformation.settingsControls, disableCommonSettings),
      flowInputMapper: this.createInputMapperController(flowMetadata, triggerSchema, input),
      replyMapper: this.createReplyMapperController(flowMetadata, triggerSchema, output),
      triggerInformation
    };
  }

  private getTriggerInformation(handlers: TriggerHandler[], triggerSchema: TriggerSchema): TriggerInformation {
    return {
      settingsControls: this.getAllSettingsControls(triggerSchema),
      trigger: {
        handlersCount: handlers.length,
        homePage: triggerSchema.homepage,
        readme: triggerSchema.homepage
      }
    };
  }

  private getAllSettingsControls(schema: TriggerSchema): TriggerInformation['settingsControls'] {
    const {settings: triggerSettings, handler} = schema;
    const {settings: handlerSettings} = handler;
    return {
      triggerSettings: this.reduceSettingsAndGetInfo(triggerSettings),
      handlerSettings: this.reduceSettingsAndGetInfo(handlerSettings)
    };
  }

  private createReplyMapperController(flowMetadata, triggerSchema, output: any) {
    return this.mapperControllerFactory.createController(
      flowMetadata && flowMetadata.output ? flowMetadata.output : [],
      triggerSchema.reply || [],
      output,
    );
  }

  private createInputMapperController(flowMetadata, triggerSchema, input: any) {
    return this.mapperControllerFactory.createController(
      flowMetadata && flowMetadata.input ? flowMetadata.input : [],
      triggerSchema.outputs || [],
      input
    );
  }

  private reduceSettingsAndGetInfo(settings: SchemaAttribute[]): Dictionary<SettingControlInfo> {
    return (settings || []).reduce((allSettings, setting) => {
      allSettings[setting.name] = {
        ...setting,
        propsAllowed: [],
        validations: createValidatorsForSchema(setting)
      };
      return allSettings;
    }, {});
  }

}
