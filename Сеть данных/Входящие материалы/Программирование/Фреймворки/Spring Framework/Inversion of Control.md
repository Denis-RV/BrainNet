# Inversion of Control (loC)
*необходимо знать:* [[Intro to Spring]]
*теги:* #spring #java 

---
## Проблемы зависимостей

- **Сильная зависимость**. Класс MusicPlayer сильно зависит от ClfssicalMuxic. Класс MusicPlayer заточен на работу только с classiczlMusic.

	![Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%201.png](Untitled%201%202.png)

	**Решение:** Использовать интерфейс (абстрактный класс), который бы обобщал различные музыкальные жанры.

	![Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%202.png](Untitled%202%202.png)

---

- **Объекты создаются вручную.** Мы хотим вынести эти детали в конфигурационный файл, а не лезть каждый раз в код для того, чтобы поменять объект.

	![Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%203.png](Untitled%203%202.png)

	**Решение:** Использовать Spring Framework, который сам создает объекты (бины) согласно конфигурационному файлу.

---

- **MusicPlayer сам создает свои зависимости.** Это архитектурно неправильно.

	![Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%204.png](Untitled%204%201.png)

	**Решение:** Использовать принципы LoC

---

- **Создание объекта.** Объект, который мы хотим внедрить в MusicPlayer необходимо где-то создавать.

	![Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%205.png](Untitled%205%202.png)

	![Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%206.png](Untitled%206.png)

	**Решение:** проблема решается с помощью [Dependency Injection](Dependency%20Injection.md) 

---
## Пример Inversion of Control


![Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%207.png](Untitled%207.png)

![Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%208.png](Untitled%208.png)

1. MusicPlayer зависит от СlassicalMusic
2. MusicPlayer сам создает объект ClassicalMusic
3. Вместо этого мы хотим передавать объект ClassicalMusic в MusicPlayer - это и называется инверсией управления.

![Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%209.png](Untitled%209.png)

![Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%2010.png](Untitled%2010.png)

### Spring Container (Application Context)
==Spring Container== создает и управляет объектами. В нем они создаются и от туда извлекаются. Этот контейнер читает конфиг-файлы.

Основные функции Spring Container:
- IoC - Инверсия управления. Создание и управление объектами.
- Dependency Injection - внедрение зависимостей. DI делает объекты нашего приложения слабо зависимыми друг от друга.

IoC - аутсорсинг создания и управления объектами, т.к. передача программистом прав на создание и управление объектами Spring-y.

## Spring можно конфигурировать с помощью:

### XML файл
конфигурации c помощью XML файла (старый способ, но многие приложения до сих пор его используют). Подробнее: [[Dependency Injection]]

```xml
<bean id = "mePet"
	  class = "intro.Cat">
</bean>
```
Здесь id - идентификатор бина, class - полное имя бина. ==Spring Bean== - это объект, который создается и управляется Spring Container.
```java
public static void main(String\[\] args) {  
ClassPathXmlApplicationContext context =  
	 new ClassPathXmlApplicationContext("applicationContext.xml");  
Pet pet = context.getBean("myPet", Pet.class);  
pet.say();  

context.close();  
}
```
	

### Java аннотаций и немного XML (современный способ).
Процесс состоит из 2-х этапов:
1. Сканирование классов и поиск аннотаций @Component
2. Создание (регистрация) бина в Spring Container-e

![[Pasted image 20210226021719.png]]

**Если к аннотации @Component не прописать bean id, то бину будет назначен дефолтный id, который получается из имени класса, заменяя его первую заглавную букву на прописную, НО! Если две заглавные буквы идут в названии класса, то дефолтный id будет таким же:**
![[Pasted image 20210226023346.png]]

Зависимости внедряются с помощью аннотации [[@Autowired]].
Тажже с помощью [[@Qualifier]] указывается бин, который будет использован. Для внедрения строк и др. значений можно использовать [[@Value]].
Scope указывается с помощью [[@Scope]].

### Вся конфигурация на Java (современный способ).
**Способ 1:**
- Необходимо создать [[@Configuration]] класс MyConfig:
	```java
	@Configuration
	@ComponentScan("our.package_for_scan")
	public class MyConfig {
	}
	```
- Добавляем в main контекст:
	```java
	AnnotationConfigApplicationContext context =   
      new AnnotationConfigApplicationContext(MyConfig.class);
	```

**Способ 2:**
\- Этот способ не использует сканирование пакета и поиск бинов. Все бины и DI описываются внутри класса - конфигурации [[@Configuration]]. Бины помечаются [[@Bean]]. Этот способ не использует [[@Autowired]]. Название метода - это bean id. 
MyConfig:
```java
@Configuration  
public class MyConfig {  
  
   @Bean  
   @Scope("singleton")
 public Pet catBean() {  
      return new Cat();  
 }  
}
```
Main:
```java
public static void main(String[] args) {  
   AnnotationConfigApplicationContext context =  
         new AnnotationConfigApplicationContext(MyConfig.class);  
  
 Pet pet = context.getBean("catBean", Pet.class);  
  
 pet.say();  
  
 context.close();  
}
```
Если надо указать файл со значениями полей, используем [[@PropertySource]]:
![[Pasted image 20210227010553.png]]

---
### See next:
- [[Dependency Injection]]
- [[Bean]]