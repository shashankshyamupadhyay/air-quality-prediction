# Air Quality Prediction using Deep Neural Networks

**Author**: Shashank Upadhyay  
**Enrollment No**: A023167024145  
**Class**: 4DS3-X

## Overview
Predicting air quality indices using Hybrid LSTM-CNN deep learning architecture.

## Status
🚀 Currently training first model on Google Colab
- Epochs: In progress
- Dataset: UCI Air Quality Dataset
- Model: Hybrid CNN-LSTM with Attention

## ✅ First Training Results (COMPLETED)

**Date**: January 21, 2025  
**Training Duration**: 12 epochs (early stopping)  
**Dataset**: UCI Air Quality Dataset  
**Configuration**:
- Lookback window: 168 hours (7 days)
- Forecast horizon: 24 hours (1 day)
- Target: CO(GT)

**Performance Metrics**:
- RMSE: [YOUR NUMBER]
- MAE: [YOUR NUMBER]
- R² Score: [YOUR NUMBER]

**Model**: Hybrid LSTM-CNN with Attention  
**Status**: ✅ Training complete, model saved

![Training Results](results.png)

## Quick Facts
- **Dataset**: 9,358 hourly observations
- **Location**: Italian city monitoring station
- **Features**: CO, NOx, NO2, Benzene + Meteorological data
- **Goal**: Multi-horizon predictions (1-day to 14-day)

## Next Steps
- [ ] Complete initial training run
- [ ] Upload Colab notebook
- [ ] Document results
- [ ] Build API

---
*Project started: January 2026*
