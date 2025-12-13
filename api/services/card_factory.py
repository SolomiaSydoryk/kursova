"""
Factory Method Pattern для створення карток лояльності.
Дозволяє створювати різні типи карток з різними параметрами.
"""
from abc import ABC, abstractmethod
from api.models import Card
from decimal import Decimal


class CardFactory(ABC):
    """Абстрактна фабрика для створення карток"""
    
    @abstractmethod
    def create_card(self) -> Card:
        """Створити картку лояльності"""
        pass


class StandardCardFactory(CardFactory):
    """Фабрика для створення стандартних карток"""
    
    def create_card(self) -> Card:
        card, created = Card.objects.get_or_create(
            type=Card.TYPE_STANDARD,
            defaults={
                'benefits': 'Базові знижки та накопичення бонусних балів (1% від суми)',
                'price': Decimal('0.00'),
                'bonus_multiplier': 0.01  # 1% від суми
            }
        )
        return card


class PremiumCardFactory(CardFactory):
    """Фабрика для створення преміум карток"""
    
    def create_card(self) -> Card:
        card, created = Card.objects.get_or_create(
            type=Card.TYPE_PREMIUM,
            defaults={
                'benefits': '50% знижка на плавання, 1% бонусні бали від зниженої суми',
                'price': Decimal('150.00'),
                'bonus_multiplier': 0.01  # 1% від зниженої суми
            }
        )
        return card


class CardFactoryMethod:
    """Метод для отримання відповідної фабрики"""
    
    @staticmethod
    def get_factory(card_type: str) -> CardFactory:
        """
        Отримати фабрику для створення картки залежно від типу.
        
        Args:
            card_type: Тип картки ('standard', 'premium')
            
        Returns:
            Відповідна фабрика для створення картки
            
        Raises:
            ValueError: Якщо тип картки невідомий
        """
        factories = {
            Card.TYPE_STANDARD: StandardCardFactory(),
            Card.TYPE_PREMIUM: PremiumCardFactory(),
        }
        
        factory = factories.get(card_type)
        if not factory:
            raise ValueError(f"Невідомий тип картки: {card_type}")
        
        return factory
    
    @staticmethod
    def create_card_by_type(card_type: str) -> Card:
        """
        Створити картку за типом (зручний метод).
        
        Args:
            card_type: Тип картки ('standard', 'premium', 'corporate')
            
        Returns:
            Створена або існуюча картка
        """
        factory = CardFactoryMethod.get_factory(card_type)
        return factory.create_card()

