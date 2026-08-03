import express from 'express';
import { protectAdmin } from '../middleware/auth.js';
import {
    createPricingRule,
    updatePricingRule,
    deletePricingRule,
    getAllPricingRules,
} from '../controllers/pricingRuleController.js';

const pricingRuleRouter = express.Router();

pricingRuleRouter.get('/', protectAdmin, getAllPricingRules);
pricingRuleRouter.post('/', protectAdmin, createPricingRule);
pricingRuleRouter.put('/:ruleId', protectAdmin, updatePricingRule);
pricingRuleRouter.delete('/:ruleId', protectAdmin, deletePricingRule);

export default pricingRuleRouter;
