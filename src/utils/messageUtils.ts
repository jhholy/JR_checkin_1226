export const messages = {
  checkIn: {
    success: '签到成功！课时已扣除。祝您训练愉快！\nCheck-in successful! Session deducted. Enjoy your training!',
    extraCheckInGroup: '您暂无有效的团课卡，已记录为额外签到（不扣除课时）。\n请及时办理会员卡以享受更好的课程体验。\n\nNo valid group class card found, recorded as extra check-in (no session deducted).\nPlease purchase a membership card for better experience.',
    extraCheckInPrivate: '您暂无有效的私教卡，已记录为额外签到（不扣除课时）。\n请及时办理私教卡以享受专业的一对一训练。\n\nNo valid private training card found, recorded as extra check-in (no session deducted).\nPlease purchase a private training card for professional one-on-one training.',
    duplicateCheckIn: '今日已在该时段签到。如需更改时间，请联系管理员。\n\nAlready checked in for this time slot today. Please contact admin if you need to change the time.',
    memberNotFound: '未找到会员信息，请检查姓名或前往新会员签到。\n\nMember not found, please check your name or proceed to new member check-in.',
    duplicateName: '存在多个同名会员，请输入邮箱以验证身份。\n\nMultiple members found with the same name, please enter email to verify.',
    error: '签到失败，请重试或联系管理员。\n\nCheck-in failed, please try again or contact admin.',
    privateSuccess: '私教课签到成功！课时已扣除。\n祝您训练愉快！\n\nPrivate class check-in successful! Session deducted.\nEnjoy your training!',
    privateCardExpired: '您的私教卡已过期，已记录为额外签到（不扣除课时）。\n请及时续费以继续享受专业训练。\n\nYour private training card has expired, recorded as extra check-in (no session deducted).\nPlease renew your card to continue professional training.',
    privateNoSessions: '您的私教卡课时已用完，已记录为额外签到（不扣除课时）。\n请及时购买新的课时。\n\nNo remaining sessions in your private training card, recorded as extra check-in (no session deducted).\nPlease purchase new sessions.',
    privateCardMismatch: '未找到匹配的私教卡，已记录为额外签到（不扣除课时）。\n请确认您的私教卡类型或联系管理员。\n\nNo matching private training card found, recorded as extra check-in (no session deducted).\nPlease verify your card type or contact admin.'
  },
  validation: {
    nameRequired: '请输入姓名\nPlease enter your name',
    emailRequired: '请输入邮箱\nPlease enter your email',
    invalidName: '姓名格式不正确\nInvalid name format',
    invalidEmail: '邮箱格式不正确\nInvalid email format',
    emailRequiredNewMember: '新会员注册需要填写邮箱\nEmail is required for new member registration'
  },
  memberExists: '会员已存在，请前往会员签到页面。\n\nMember already exists, please go to member check-in page.',
  newMember: '新会员签到成功！请联系管理员办理会员卡。\n\nNew member check-in successful! Please contact admin to purchase membership card.',
  error: '操作失败，请重试。\n\nOperation failed, please try again.',
  databaseError: '数据库错误，请联系管理员。\n\nDatabase error, please contact admin.'
};