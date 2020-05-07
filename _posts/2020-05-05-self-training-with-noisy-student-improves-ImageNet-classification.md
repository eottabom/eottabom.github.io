---
layout: post
title: "Self-training with Noisy student improves ImageNet classification"
description: "Student Model에 Noise를 주입 후 자가 학습하여 ImageNet classification 성능 향상에 대한 논문 리뷰"
excerpt: "Student Model에 Noise를 주입 후 자가 학습하여 ImageNet classification 성능 향상"
category: Paper
comments: true
---

2019년 11월 11일 공개된 논문인 [Self-training with Noisy student improves ImageNet classification](https://arxiv.org/pdf/1911.04252.pdf) 에 대한 논문 리뷰입니다.
[EfficientNet](https://arxiv.org/pdf/1905.11946.pdf) 기반으로 ImageNet 데이터넷에 대해서 State-of-the-art(SOTA)를 갱신한 논문입니다.

<br>

### 연구 배경 및 목적 
----
+ 연구 배경
    - 기존의 Classification에 관한 연구는 학습 시 라벨링 된 이미지들이 필요
    - 데이터 셋 중에서 라벨링이 없는 이미지를 학습시켜 정확성과 Robustness를 향상 시키는 것은 제한적
+ 목적
    - 라벨링이 없는 이미지를 사용하여 최신 ImageNet 데이터 셋에 대한 정확도와 Robustness에 대한 검증
    
<br>

### 제안하는 알고리즘
----
![Self-training Algorithm]({{site.baseurl}}/img/post/paper/self-training/self-training.jpg) <br>
<div style="text-align: center;">
    < Self-training Algorithm >
</div>

![Algorithm]({{site.baseurl}}/img/post/paper/self-training/self-training-model.png) <br>
<div style="text-align: center;">
    < Self-training >
</div>


<br>
 
### 실험 방법
----
+ Datasets
    - Labeled dataset : ImageNet 2012 ILSVRC
    - Unlabeled dataset : JFT-300M
    - 데이터 필터링 / 균형 조정 
    - ImageNet에서 훈련된 EfficientNet-B0 실행하여 JFT데이터의 각 이미지 라벨링 예측
    - 각 클래스별 가장 높은 130K 이미지 선택
    - 130K 미만의 이미지인 경우 130K 이미지를 가질 수 있도록 이미지 무작위 복제
    - Student Model 학습에 사용하는 총 이미지 수는 130M
<br>
+ Architecture
    - Base Model : EfficientNet
    - EfficientNet-B7를 확장하고 EfficientNet-L0, L1, L2를 얻음
    - EfficientNet-L0은 EfficientNet-B7보다 넓고 깊지만 낮은 해상도
    - EfficientNet-L1은 너비를 늘려 EfficientNet-L0에서 확장
    - 복합 스케일링과 모든 차원을 확장하여 EfficientNet-L2를 얻음
<br>    
+ Training details
    - 라벨링 있는 이미지(ImageNet) : Batch Size 2048
        - EfficientNet-B4보다 큰 모델인 경우(EfficientNet-L0, L1, L2) 350 epoch
        - EfficientNet-B4보다 작은 모델인 경우 700 epoch
    - 라벨링이 없는 이미지(JFT)
        - EfficientNet-B7, L0, L1, L2 대형 모델의 라벨링이 있는 이미지 배치 크기의 3배
         - 더 작은 모델의 경우 라벨링이 있는 이미지의 배치 크기와 동일 <br>
         → 라벨링이 있는 이미지와 없는 이미지가 함께 연결되어 평균 교차 엔트로피 손실 계산
<br>          
+ fix train-test resolution discrepancy
    - 처음 350 epoch동안 작은 해상도로 학습
    - 1.5 epoch 동안 unaugmented labeled images에 대해 큰 해상도로 fine-tuning
    - fine-tuning 중에 얕은 레이어로 고정
<br>    
+ Noise
    - Stochastic depth : 0.8
    - Dropout : 0.5
    - RandAugment : 27 <br>
     → 모든 레이어에서 동일하게 적용
<br>     
+ Iterative training
    -  Teacher Model, Student Model 모두 EfficientNet-B7을 사용하여 정확도 개선
    - 개선 된 EfficientNet-B7 모델을 Teacher Model로 사용 EfficientNet-L0 Student Model 학습
    - EfficientNet-L0을 Teacher Model로 사용 EfficientNet-L1 Student Model 학습
    - EfficientNet-L1을 Teacher Model로 사용 EfficientNet-L2 Student Model 학습
    - EfficientNet-L2을 Teacher Model로 사용 다른 EfficientNet-L2 Student Model 학습

<br>
    
### 실험 결과
---- 
+ ImageNet 결과
    - Noisy Student for EfficientNet B0-B7 without Iterative Training <br>
     → Noisy Student가 포함된 EfficientNet은 모든 모델 크기에 대해서 약 0.8% 성능이 향상
     
![ImageNetResult]({{site.baseurl}}/img/post/paper/self-training/ImageNetResult.png) <br>
<br>
+ Robustness Results on ImageNet-A, ImageNet-C, ImageNet-P
![RobustnessResult]({{site.baseurl}}/img/post/paper/self-training/RobustnessResult.png) <br>
    - 모델의 신빙성, Robustness 측정을 위한 벤치마크 test set인 ImageNet-A,C,P를 이용한 실험
    - ImageNet-A : 기존 Classification network들이 공통적으로 어려워하는 실제 Natural Images로 만든 데이터셋
    - ImageNet-C,P : 이미지에 blurring, fogging, rotation, scaling 등 흔히 발생할 수 있는 Corruption과 Perturbation을 적용시켜 만든 데이터셋
    - ImageNet-A 데이터셋에서 높은 정확도
    - ImageNet-C에서 사용한 mCE(Mean Corruption Rate)지표도 가장 낮음
    - ImageNet-P에서 사용한 mFR(Mean Flip Rate)지표도 가장 낮음
    - Baseline인 EfficientNet 자체가 Natural Adversarial Example에서 견고한 모델임을 검증하였고, 
      Noisy Student를 적용하면 훨씬 더 견고해짐을 검증
<br><br><br>        
+ Adversarial Robustness Results
![AdversarialRobustnessResults]({{site.baseurl}}/img/post/paper/self-training/AbversarialRobustnessResult.png) <br>
    - Adversarial Attack에 얼마나 robust 하게 버티는지 평가한 실험
    - Adversarial Attack에 많이 사용되는 FGSM 공격을 EfficientNet에 가했을 때의 성능 측정
    - EfficientNet에 Noisy Student 알고리즘 적용했을 때의 성능을 측정하여 비교
    

<br>  

### 결론
----
> 라벨링이 없는 이미지를 사용하여 최신 ImageNet 모델의 정확성과 견고성을 크게 향상 <br>
  Self Training은 라벨링이 없는 데이터를 대규모로 활용할 수 있는 간단하고 효과적인 알고리즘 <br>
  Noise를 사용하면 1.9% 높은 87.4%의 정확도를 달성 <br>
  Noisy Student가 컴퓨터 비전 모델의 견고성 부족 문제를 해결하는데 도움 <br>
  의도적인 데이터 확대 없이 ImageNet-A,C,P의 정확도를 크게 향상 <br>