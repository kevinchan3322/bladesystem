const { Data } = require('./data.js');
const { BladePredictionResultModel } = require('./blade-prediction-result.js');
const {
    BladePredictionFeedbackModel,
} = require('./blade-prediction-feedback.js');
const { WorkOrderModel } = require('./work-order.js');
const { WorkReportingRecordModel } = require('./work-reporting-record.js');
const { BladeChangeRecordModel } = require('./blade-change-record.js');
const {
    BladeHolderSpecificationModel,
} = require('./blade-holder-specification.js');
const {
    BladeCompensationRecordModel,
} = require('./blade-compensation-record.js');

const { BladeSpecificationModel } = require('./blade-specification.js');
const {
    MachiningTaskSpecificationModel,
} = require('./machining-task-specification.js');
const {
    MachinedPartSpecificationModel,
} = require('./machined-part-specification.js');

const { UserModel } = require('./user.js');
const { UserLogModel } = require('./user-log.js');

module.exports = {
    Data,
    BladePredictionResultModel,
    BladePredictionFeedbackModel,
    WorkOrderModel,
    WorkReportingRecordModel,
    BladeChangeRecordModel,
    BladeHolderSpecificationModel,
    BladeCompensationRecordModel,
    BladeSpecificationModel,
    MachiningTaskSpecificationModel,
    MachinedPartSpecificationModel,

    UserModel,
    UserLogModel,
};
