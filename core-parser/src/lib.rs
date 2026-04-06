use lazy_static::lazy_static;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum IntentAction {
    Swap,
    Send,
    Stake,
    Unstake,
    Balance,
    Price,
    BuyProduct,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum EntityType {
    Token,
    Amount,
    Address,
    Validator,
    Product,
    Action,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Entity {
    pub entity_type: EntityType,
    pub value: String,
    pub confidence: f64,
    pub start: usize,
    pub end: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedIntent {
    pub action: IntentAction,
    pub confidence: f64,
    pub parameters: HashMap<String, String>,
    pub entities: Vec<Entity>,
    pub processing_time_ms: f64,
}

lazy_static! {
    static ref SWAP_PATTERNS: Vec<Regex> = vec![
        Regex::new(r"(?i)swap\s+(\d+\.?\d*)\s+(\w+)\s+(?:for|to)\s+(\w+)").unwrap(),
        Regex::new(r"(?i)exchange\s+(\d+\.?\d*)\s+(\w+)\s+(?:for|to)\s+(\w+)").unwrap(),
        Regex::new(r"(?i)trade\s+(\d+\.?\d*)\s+(\w+)\s+(?:for|to)\s+(\w+)").unwrap(),
    ];
    
    static ref SEND_PATTERNS: Vec<Regex> = vec![
        Regex::new(r"(?i)send\s+(\d+\.?\d*)\s+(\w+)\s+to\s+([A-Za-z0-9]{32,44})").unwrap(),
        Regex::new(r"(?i)transfer\s+(\d+\.?\d*)\s+(\w+)\s+to\s+([A-Za-z0-9]{32,44})").unwrap(),
    ];
    
    static ref STAKE_PATTERNS: Vec<Regex> = vec![
        Regex::new(r"(?i)stake\s+(\d+\.?\d*)\s+(\w+)").unwrap(),
        Regex::new(r"(?i)delegate\s+(\d+\.?\d*)\s+(\w+)").unwrap(),
    ];
    
    static ref UNSTAKE_PATTERNS: Vec<Regex> = vec![
        Regex::new(r"(?i)unstake\s+(\d+\.?\d*)\s+(\w+)").unwrap(),
        Regex::new(r"(?i)undelegate\s+(\d+\.?\d*)\s+(\w+)").unwrap(),
    ];
    
    static ref BALANCE_PATTERNS: Vec<Regex> = vec![
        Regex::new(r"(?i)(?:show|check|what'?s?)\s+(?:my\s+)?balance").unwrap(),
        Regex::new(r"(?i)how\s+much\s+(?:\w+\s+)?(?:do\s+)?i\s+have").unwrap(),
    ];
    
    static ref PRICE_PATTERNS: Vec<Regex> = vec![
        Regex::new(r"(?i)(?:what'?s?|check)\s+(?:the\s+)?price\s+of\s+(\w+)").unwrap(),
        Regex::new(r"(?i)how\s+much\s+is\s+(\w+)").unwrap(),
        Regex::new(r"(?i)(\w+)\s+price").unwrap(),
    ];
    
    static ref BUY_PATTERNS: Vec<Regex> = vec![
        Regex::new(r"(?i)buy\s+(.+?)(?:\s+with\s+usdc)?$").unwrap(),
        Regex::new(r"(?i)purchase\s+(.+?)(?:\s+with\s+usdc)?$").unwrap(),
    ];
    
    static ref TOKEN_PATTERN: Regex = Regex::new(r"\b(SOL|USDC|USDT|BTC|ETH|BONK|JUP|RAY|ORCA)\b").unwrap();
    static ref AMOUNT_PATTERN: Regex = Regex::new(r"\b(\d+\.?\d*)\b").unwrap();
    static ref ADDRESS_PATTERN: Regex = Regex::new(r"\b([A-Za-z0-9]{32,44})\b").unwrap();
}

pub struct IntentParser {
    known_tokens: Vec<String>,
}

impl IntentParser {
    pub fn new() -> Self {
        Self {
            known_tokens: vec![
                "SOL".to_string(),
                "USDC".to_string(),
                "USDT".to_string(),
                "BTC".to_string(),
                "ETH".to_string(),
                "BONK".to_string(),
                "JUP".to_string(),
                "RAY".to_string(),
                "ORCA".to_string(),
            ],
        }
    }

    pub fn parse(&self, query: &str) -> Result<ParsedIntent, String> {
        let start_time = std::time::Instant::now();
        
        if query.trim().is_empty() {
            return Err("Empty query provided".to_string());
        }

        let normalized = query.to_lowercase();
        let mut action = IntentAction::Unknown;
        let mut parameters = HashMap::new();
        let mut confidence = 0.0;

        if let Some((act, params, conf)) = self.try_parse_swap(&normalized) {
            action = act;
            parameters = params;
            confidence = conf;
        } else if let Some((act, params, conf)) = self.try_parse_send(&normalized) {
            action = act;
            parameters = params;
            confidence = conf;
        } else if let Some((act, params, conf)) = self.try_parse_stake(&normalized) {
            action = act;
            parameters = params;
            confidence = conf;
        } else if let Some((act, params, conf)) = self.try_parse_unstake(&normalized) {
            action = act;
            parameters = params;
            confidence = conf;
        } else if let Some((act, params, conf)) = self.try_parse_balance(&normalized) {
            action = act;
            parameters = params;
            confidence = conf;
        } else if let Some((act, params, conf)) = self.try_parse_price(&normalized) {
            action = act;
            parameters = params;
            confidence = conf;
        } else if let Some((act, params, conf)) = self.try_parse_buy(&normalized) {
            action = act;
            parameters = params;
            confidence = conf;
        }

        let entities = self.extract_entities(query);
        let processing_time_ms = start_time.elapsed().as_secs_f64() * 1000.0;

        Ok(ParsedIntent {
            action,
            confidence,
            parameters,
            entities,
            processing_time_ms,
        })
    }

    fn try_parse_swap(&self, query: &str) -> Option<(IntentAction, HashMap<String, String>, f64)> {
        for pattern in SWAP_PATTERNS.iter() {
            if let Some(caps) = pattern.captures(query) {
                let mut params = HashMap::new();
                params.insert("amount".to_string(), caps.get(1)?.as_str().to_string());
                params.insert("tokenA".to_string(), caps.get(2)?.as_str().to_uppercase());
                params.insert("tokenB".to_string(), caps.get(3)?.as_str().to_uppercase());
                return Some((IntentAction::Swap, params, 0.9));
            }
        }
        None
    }

    fn try_parse_send(&self, query: &str) -> Option<(IntentAction, HashMap<String, String>, f64)> {
        for pattern in SEND_PATTERNS.iter() {
            if let Some(caps) = pattern.captures(query) {
                let mut params = HashMap::new();
                params.insert("amount".to_string(), caps.get(1)?.as_str().to_string());
                params.insert("tokenA".to_string(), caps.get(2)?.as_str().to_uppercase());
                params.insert("recipient".to_string(), caps.get(3)?.as_str().to_string());
                return Some((IntentAction::Send, params, 0.9));
            }
        }
        None
    }

    fn try_parse_stake(&self, query: &str) -> Option<(IntentAction, HashMap<String, String>, f64)> {
        for pattern in STAKE_PATTERNS.iter() {
            if let Some(caps) = pattern.captures(query) {
                let mut params = HashMap::new();
                params.insert("amount".to_string(), caps.get(1)?.as_str().to_string());
                params.insert("tokenA".to_string(), caps.get(2)?.as_str().to_uppercase());
                return Some((IntentAction::Stake, params, 0.9));
            }
        }
        None
    }

    fn try_parse_unstake(&self, query: &str) -> Option<(IntentAction, HashMap<String, String>, f64)> {
        for pattern in UNSTAKE_PATTERNS.iter() {
            if let Some(caps) = pattern.captures(query) {
                let mut params = HashMap::new();
                params.insert("amount".to_string(), caps.get(1)?.as_str().to_string());
                params.insert("tokenA".to_string(), caps.get(2)?.as_str().to_uppercase());
                return Some((IntentAction::Unstake, params, 0.9));
            }
        }
        None
    }

    fn try_parse_balance(&self, query: &str) -> Option<(IntentAction, HashMap<String, String>, f64)> {
        for pattern in BALANCE_PATTERNS.iter() {
            if pattern.is_match(query) {
                return Some((IntentAction::Balance, HashMap::new(), 0.95));
            }
        }
        None
    }

    fn try_parse_price(&self, query: &str) -> Option<(IntentAction, HashMap<String, String>, f64)> {
        for pattern in PRICE_PATTERNS.iter() {
            if let Some(caps) = pattern.captures(query) {
                let mut params = HashMap::new();
                params.insert("tokenA".to_string(), caps.get(1)?.as_str().to_uppercase());
                return Some((IntentAction::Price, params, 0.9));
            }
        }
        None
    }

    fn try_parse_buy(&self, query: &str) -> Option<(IntentAction, HashMap<String, String>, f64)> {
        for pattern in BUY_PATTERNS.iter() {
            if let Some(caps) = pattern.captures(query) {
                let mut params = HashMap::new();
                params.insert("productQuery".to_string(), caps.get(1)?.as_str().trim().to_string());
                return Some((IntentAction::BuyProduct, params, 0.85));
            }
        }
        None
    }

    fn extract_entities(&self, query: &str) -> Vec<Entity> {
        let mut entities = Vec::new();

        for caps in TOKEN_PATTERN.captures_iter(query) {
            if let Some(m) = caps.get(0) {
                entities.push(Entity {
                    entity_type: EntityType::Token,
                    value: m.as_str().to_uppercase(),
                    confidence: 0.95,
                    start: m.start(),
                    end: m.end(),
                });
            }
        }

        for caps in AMOUNT_PATTERN.captures_iter(query) {
            if let Some(m) = caps.get(0) {
                entities.push(Entity {
                    entity_type: EntityType::Amount,
                    value: m.as_str().to_string(),
                    confidence: 0.9,
                    start: m.start(),
                    end: m.end(),
                });
            }
        }

        for caps in ADDRESS_PATTERN.captures_iter(query) {
            if let Some(m) = caps.get(0) {
                entities.push(Entity {
                    entity_type: EntityType::Address,
                    value: m.as_str().to_string(),
                    confidence: 0.85,
                    start: m.start(),
                    end: m.end(),
                });
            }
        }

        entities
    }
}

impl Default for IntentParser {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_swap() {
        let parser = IntentParser::new();
        let result = parser.parse("swap 5 SOL for USDC").unwrap();
        
        assert_eq!(result.action, IntentAction::Swap);
        assert_eq!(result.parameters.get("amount"), Some(&"5".to_string()));
        assert_eq!(result.parameters.get("tokenA"), Some(&"SOL".to_string()));
        assert_eq!(result.parameters.get("tokenB"), Some(&"USDC".to_string()));
        assert!(result.confidence > 0.8);
    }

    #[test]
    fn test_parse_send() {
        let parser = IntentParser::new();
        let address = "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK";
        let result = parser.parse(&format!("send 2 SOL to {}", address)).unwrap();
        
        assert_eq!(result.action, IntentAction::Send);
        assert_eq!(result.parameters.get("amount"), Some(&"2".to_string()));
        assert_eq!(result.parameters.get("recipient"), Some(&address.to_string()));
    }

    #[test]
    fn test_parse_balance() {
        let parser = IntentParser::new();
        let result = parser.parse("show my balance").unwrap();
        
        assert_eq!(result.action, IntentAction::Balance);
        assert!(result.confidence > 0.9);
    }

    #[test]
    fn test_entity_extraction() {
        let parser = IntentParser::new();
        let result = parser.parse("swap 5 SOL for USDC").unwrap();
        
        let token_entities: Vec<_> = result.entities.iter()
            .filter(|e| e.entity_type == EntityType::Token)
            .collect();
        
        assert_eq!(token_entities.len(), 2);
    }

    #[test]
    fn test_empty_query() {
        let parser = IntentParser::new();
        let result = parser.parse("");
        
        assert!(result.is_err());
    }
}
