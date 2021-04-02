Используется, когда нужно написать один и тот же pointcut для нескольких сквозных Advice-ов.

Пример использования в классе-аспекте ([[@Aspect]]):
```java
@Pointcut("execution(\* get\*())")  
private void allGetMethods() {}  
  
@Before("allGetMethods()")  
public void beforeGetLoggingAdvice() {  
   System.out.println("beforeGetBookAdvice: попытка получить книгу/журнал");  
}
```

![[Pasted image 20210227173727.png]]


---
*теги:* #java  #spring 