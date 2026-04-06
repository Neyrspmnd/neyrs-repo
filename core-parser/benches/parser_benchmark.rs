use criterion::{black_box, criterion_group, criterion_main, Criterion};
use neyrs_parser::IntentParser;

fn parse_swap_benchmark(c: &mut Criterion) {
    let parser = IntentParser::new();
    
    c.bench_function("parse swap intent", |b| {
        b.iter(|| {
            parser.parse(black_box("swap 5 SOL for USDC")).unwrap()
        })
    });
}

fn parse_send_benchmark(c: &mut Criterion) {
    let parser = IntentParser::new();
    let address = "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK";
    let query = format!("send 2 SOL to {}", address);
    
    c.bench_function("parse send intent", |b| {
        b.iter(|| {
            parser.parse(black_box(&query)).unwrap()
        })
    });
}

fn parse_balance_benchmark(c: &mut Criterion) {
    let parser = IntentParser::new();
    
    c.bench_function("parse balance intent", |b| {
        b.iter(|| {
            parser.parse(black_box("show my balance")).unwrap()
        })
    });
}

fn parse_price_benchmark(c: &mut Criterion) {
    let parser = IntentParser::new();
    
    c.bench_function("parse price intent", |b| {
        b.iter(|| {
            parser.parse(black_box("what's the price of SOL")).unwrap()
        })
    });
}

fn entity_extraction_benchmark(c: &mut Criterion) {
    let parser = IntentParser::new();
    
    c.bench_function("entity extraction", |b| {
        b.iter(|| {
            parser.parse(black_box("swap 100.5 BONK for USDC with 50 slippage")).unwrap()
        })
    });
}

criterion_group!(
    benches,
    parse_swap_benchmark,
    parse_send_benchmark,
    parse_balance_benchmark,
    parse_price_benchmark,
    entity_extraction_benchmark
);

criterion_main!(benches);
